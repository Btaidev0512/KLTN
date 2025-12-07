const db = require('../config/database');

class Review {
    // Create a new review
    static async create(reviewData) {
        try {
            const {
                user_id,
                product_id,
                order_id = null,
                order_item_id = null,
                rating,
                title = null,
                comment = null,
                images = null
            } = reviewData;

            // Validate rating
            if (!rating || rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            // Check if user has already reviewed this product from this order
            if (order_id) {
                const [existingReviews] = await db.execute(
                    'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
                    [user_id, product_id, order_id]
                );

                if (existingReviews.length > 0) {
                    throw new Error('You have already reviewed this product for this order');
                }

                // Verify that user actually purchased this product
                const [orderItems] = await db.execute(`
                    SELECT oi.* FROM order_items oi
                    INNER JOIN orders o ON oi.order_id = o.order_id
                    WHERE o.order_id = ? AND o.user_id = ? AND oi.product_id = ?
                    AND o.status IN ('delivered', 'completed')
                `, [order_id, user_id, product_id]);

                if (orderItems.length === 0) {
                    throw new Error('You can only review products you have purchased and received');
                }
            }

            console.log('🌟 Creating review...', { user_id, product_id, rating, title });

            // Insert review
            const insertQuery = `
                INSERT INTO reviews (
                    user_id, product_id, order_id, order_item_id,
                    rating, title, comment, images, is_verified, is_approved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `;

            const is_verified = order_id ? 1 : 0; // Verified if from actual order

            const [result] = await db.execute(insertQuery, [
                user_id, product_id, order_id, order_item_id,
                rating, title, comment, 
                images ? JSON.stringify(images) : null,
                is_verified
            ]);

            console.log('✅ Review created with ID:', result.insertId);

            // Update product rating average
            await this.updateProductRating(product_id);

            return await this.getById(result.insertId);

        } catch (error) {
            console.error('❌ Error creating review:', error.message);
            throw new Error(`Error creating review: ${error.message}`);
        }
    }

    // Get review by ID
    static async getById(reviewId) {
        try {
            const [reviews] = await db.execute(`
                SELECT 
                    r.*,
                    u.full_name as reviewer_name,
                    u.email as reviewer_email,
                    p.product_name,
                    p.product_slug
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.user_id
                LEFT JOIN products p ON r.product_id = p.product_id
                WHERE r.review_id = ?
            `, [reviewId]);

            if (reviews.length === 0) {
                return null;
            }

            const review = reviews[0];

            // Parse images if exists
            if (review.images) {
                try {
                    review.images = JSON.parse(review.images);
                } catch (e) {
                    review.images = null;
                }
            }

            return review;

        } catch (error) {
            console.error('❌ Error getting review:', error.message);
            throw new Error(`Error getting review: ${error.message}`);
        }
    }

    // Get reviews for a product
    static async getProductReviews(productId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                rating = null,
                verified_only = false,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            const offset = (page - 1) * limit;

            let whereClause = 'WHERE r.product_id = ? AND r.is_approved = 1';
            let params = [productId];

            if (rating) {
                whereClause += ' AND r.rating = ?';
                params.push(rating);
            }

            if (verified_only) {
                whereClause += ' AND r.is_verified = 1';
            }

            const query = `
                SELECT 
                    r.review_id,
                    r.rating,
                    r.title,
                    r.comment,
                    r.images,
                    r.is_verified,
                    r.helpful_count,
                    r.not_helpful_count,
                    r.created_at,
                    r.updated_at,
                    u.full_name as reviewer_name,
                    CASE 
                        WHEN r.is_verified = 1 THEN 'Verified Purchase'
                        ELSE 'Unverified'
                    END as purchase_status
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.user_id
                ${whereClause}
                ORDER BY r.${sort_by} ${sort_order}
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);

            console.log('Executing product reviews query:', query);
            console.log('With params:', params);

            const [reviews] = await db.execute(query, params);

            // Parse images for each review
            reviews.forEach(review => {
                if (review.images) {
                    try {
                        review.images = JSON.parse(review.images);
                    } catch (e) {
                        review.images = null;
                    }
                }
            });

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM reviews r
                ${whereClause}
            `;

            const [countResult] = await db.execute(countQuery, params.slice(0, -2));
            const total = countResult[0].total;

            // Get rating distribution
            const [ratingStats] = await db.execute(`
                SELECT 
                    rating,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM reviews 
                        WHERE product_id = ? AND is_approved = 1
                    )), 1) as percentage
                FROM reviews 
                WHERE product_id = ? AND is_approved = 1
                GROUP BY rating
                ORDER BY rating DESC
            `, [productId, productId]);

            return {
                reviews,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                    has_next: page * limit < total,
                    has_prev: page > 1
                },
                rating_distribution: ratingStats
            };

        } catch (error) {
            console.error('❌ Error getting product reviews:', error.message);
            throw new Error(`Error getting product reviews: ${error.message}`);
        }
    }

    // Get user's reviews
    static async getUserReviews(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                product_id = null
            } = options;

            const offset = (page - 1) * limit;

            let whereClause = 'WHERE r.user_id = ?';
            let params = [userId];

            if (product_id) {
                whereClause += ' AND r.product_id = ?';
                params.push(product_id);
            }

            const query = `
                SELECT 
                    r.*,
                    p.product_name,
                    p.product_slug,
                    pi.image_url as product_image
                FROM reviews r
                LEFT JOIN products p ON r.product_id = p.product_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                ${whereClause}
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);

            const [reviews] = await db.execute(query, params);

            // Parse images for each review
            reviews.forEach(review => {
                if (review.images) {
                    try {
                        review.images = JSON.parse(review.images);
                    } catch (e) {
                        review.images = null;
                    }
                }
            });

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM reviews r ${whereClause}`;
            const [countResult] = await db.execute(countQuery, params.slice(0, -2));
            const total = countResult[0].total;

            return {
                reviews,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total,
                    total_pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error getting user reviews:', error.message);
            throw new Error(`Error getting user reviews: ${error.message}`);
        }
    }

    // Update review
    static async update(reviewId, updateData, userId) {
        try {
            // Verify review ownership
            const [reviews] = await db.execute(
                'SELECT * FROM reviews WHERE review_id = ? AND user_id = ?',
                [reviewId, userId]
            );

            if (reviews.length === 0) {
                throw new Error('Review not found or access denied');
            }

            const {
                rating = null,
                title = null,
                comment = null,
                images = null
            } = updateData;

            let updateFields = [];
            let params = [];

            if (rating !== null) {
                if (rating < 1 || rating > 5) {
                    throw new Error('Rating must be between 1 and 5');
                }
                updateFields.push('rating = ?');
                params.push(rating);
            }

            if (title !== null) {
                updateFields.push('title = ?');
                params.push(title);
            }

            if (comment !== null) {
                updateFields.push('comment = ?');
                params.push(comment);
            }

            if (images !== null) {
                updateFields.push('images = ?');
                params.push(images ? JSON.stringify(images) : null);
            }

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(reviewId);

            const updateQuery = `
                UPDATE reviews 
                SET ${updateFields.join(', ')} 
                WHERE review_id = ?
            `;

            await db.execute(updateQuery, params);

            console.log(`✅ Review ${reviewId} updated successfully`);

            // Update product rating if rating changed
            if (rating !== null) {
                await this.updateProductRating(reviews[0].product_id);
            }

            return await this.getById(reviewId);

        } catch (error) {
            console.error('❌ Error updating review:', error.message);
            throw error;
        }
    }

    // Delete review
    static async delete(reviewId, userId) {
        try {
            // Verify review ownership
            const [reviews] = await db.execute(
                'SELECT * FROM reviews WHERE review_id = ? AND user_id = ?',
                [reviewId, userId]
            );

            if (reviews.length === 0) {
                throw new Error('Review not found or access denied');
            }

            const productId = reviews[0].product_id;

            await db.execute('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

            console.log(`🗑️ Review ${reviewId} deleted successfully`);

            // Update product rating after deletion
            await this.updateProductRating(productId);

            return { success: true, message: 'Review deleted successfully' };

        } catch (error) {
            console.error('❌ Error deleting review:', error.message);
            throw error;
        }
    }

    // Mark review as helpful/not helpful
    static async markHelpful(reviewId, isHelpful) {
        try {
            const field = isHelpful ? 'helpful_count' : 'not_helpful_count';
            
            await db.execute(`
                UPDATE reviews 
                SET ${field} = ${field} + 1 
                WHERE review_id = ?
            `, [reviewId]);

            console.log(`👍 Review ${reviewId} marked as ${isHelpful ? 'helpful' : 'not helpful'}`);

            return await this.getById(reviewId);

        } catch (error) {
            console.error('❌ Error marking review helpful:', error.message);
            throw error;
        }
    }

    // Update product rating average
    static async updateProductRating(productId) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    COALESCE(AVG(rating), 0) as avg_rating,
                    COUNT(*) as review_count
                FROM reviews 
                WHERE product_id = ? AND is_approved = 1
            `, [productId]);

            const avgRating = Math.round(stats[0].avg_rating * 100) / 100;
            const reviewCount = stats[0].review_count;

            await db.execute(`
                UPDATE products 
                SET rating_average = ?, rating_count = ?
                WHERE product_id = ?
            `, [avgRating, reviewCount, productId]);

            console.log(`📊 Product ${productId} rating updated: ${avgRating} (${reviewCount} reviews)`);

            return { avg_rating: avgRating, review_count: reviewCount };

        } catch (error) {
            console.error('❌ Error updating product rating:', error.message);
            throw error;
        }
    }

    // Get review statistics
    static async getReviewStats(productId) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_reviews,
                    COALESCE(AVG(rating), 0) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
                    COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_reviews
                FROM reviews 
                WHERE product_id = ? AND is_approved = 1
            `, [productId]);

            const result = stats[0];
            result.average_rating = Math.round(result.average_rating * 100) / 100;

            return result;

        } catch (error) {
            console.error('❌ Error getting review stats:', error.message);
            throw error;
        }
    }
}

module.exports = Review;
