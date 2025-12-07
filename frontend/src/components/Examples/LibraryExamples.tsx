import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { ClipLoader } from 'react-spinners';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Example component showcasing all the libraries
const LibraryExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const selectOptions = [
    { value: 'vietnam', label: 'Việt Nam' },
    { value: 'usa', label: 'United States' },
    { value: 'japan', label: 'Japan' }
  ];

  const onSubmit = (data: any) => {
    setLoading(true);
    toast.success('Form submitted successfully!');
    setTimeout(() => setLoading(false), 2000);
  };

  const showToast = (type: 'success' | 'error' | 'info') => {
    switch(type) {
      case 'success':
        toast.success('Thành công! 🎉');
        break;
      case 'error':
        toast.error('Có lỗi xảy ra! 😞');
        break;
      case 'info':
        toast.info('Thông tin mới! 📢');
        break;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">React Libraries Demo</h1>
      
      {/* Framer Motion Animations */}
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg mb-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-4">🎬 Framer Motion Animations</h2>
        <div className="flex gap-4">
          <motion.button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Hover me
          </motion.button>
          <motion.div
            className="bg-gradient-to-r from-purple-400 to-pink-400 p-4 rounded"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <span className="text-white text-xl">❤️</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Icons Demo */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🎨 Icons Demo</h2>
        <div className="flex gap-4 text-2xl">
          <span className="text-red-500">❤️</span>
          <span className="text-green-500">🛒</span>
          <span className="text-yellow-500">⭐</span>
          <span className="text-blue-500">👤</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">React Icons có thể được sử dụng khi cần thiết</p>
      </div>

      {/* React Hook Form */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">📝 React Hook Form</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Your name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
            )}
          </div>
          
          <div>
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              })}
              placeholder="Your email"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? <ClipLoader size={20} color="white" /> : 'Submit'}
          </button>
        </form>
      </div>

      {/* React Select */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🌍 React Select</h2>
        <Select
          options={selectOptions}
          placeholder="Chọn quốc gia..."
          className="mb-4"
        />
      </div>

      {/* Toast Notifications */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔔 Toast Notifications</h2>
        <div className="space-x-4">
          <button
            onClick={() => showToast('success')}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Success Toast
          </button>
          <button
            onClick={() => showToast('error')}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Error Toast
          </button>
          <button
            onClick={() => showToast('info')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Info Toast
          </button>
        </div>
      </div>

      {/* Loading Spinners */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">⏳ Loading Spinners</h2>
        <div className="flex gap-4 items-center">
          <ClipLoader color="#3B82F6" size={30} />
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>

      {/* Loading Skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">💀 Loading Skeleton</h2>
        <SkeletonTheme baseColor="#ebebeb" highlightColor="#f5f5f5">
          <div className="space-y-2">
            <Skeleton height={20} />
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} width="60%" />
          </div>
        </SkeletonTheme>
      </div>
    </div>
  );
};

export default LibraryExamples;