import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/Contact.css';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FAQ {
  question: string;
  answer: string;
  open: boolean;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: 'Làm thế nào để theo dõi đơn hàng của tôi?',
      answer: 'Bạn có thể theo dõi đơn hàng bằng cách đăng nhập vào tài khoản của mình trên website hoặc sử dụng mã đơn hàng được gửi qua email sau khi đặt hàng thành công.',
      open: false
    },
    {
      question: 'Thời gian giao hàng là bao lâu?',
      answer: 'Thời gian giao hàng từ 1-3 ngày đối với khu vực nội thành TP.HCM và Hà Nội, 3-5 ngày đối với các tỉnh thành khác tùy thuộc vào khu vực.',
      open: false
    },
    {
      question: 'Chính sách đổi trả hàng như thế nào?',
      answer: 'TT Shop chấp nhận đổi trả trong vòng 30 ngày kể từ ngày mua hàng nếu sản phẩm có lỗi từ nhà sản xuất. Sản phẩm đổi trả phải còn nguyên tem mác, chưa qua sử dụng.',
      open: false
    },
    {
      question: 'Tôi có thể hủy đơn hàng sau khi đã đặt không?',
      answer: 'Bạn có thể hủy đơn hàng trong vòng 24 giờ sau khi đặt hàng và trước khi đơn hàng được xác nhận. Vui lòng liên hệ hotline để được hỗ trợ hủy đơn.',
      open: false
    },
    {
      question: 'TT Shop có cung cấp dịch vụ đan cước vợt không?',
      answer: 'Có, TT Shop cung cấp dịch vụ đan cước vợt chuyên nghiệp với nhiều loại cước và lực căng khác nhau. Phí đan cước từ 50,000đ đến 150,000đ tùy loại cước.',
      open: false
    }
  ]);

  useEffect(() => {
    document.title = 'Liên hệ - TT Shop';
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    setTimeout(() => {
      toast.success('Cảm ơn! Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      setSubmitting(false);
    }, 1500);
  };

  const toggleFaq = (index: number) => {
    setFaqs(prev => prev.map((faq, i) => ({
      ...faq,
      open: i === index ? !faq.open : false
    })));
  };

  const storeLocations = [
    {
      id: 1,
      name: 'TT Shop Super Center',
      phone: '0936155994',
      address: '390/2 Hà Huy Giáp, Phường Thạnh Lộc, Quận 12'
    },
    {
      id: 2,
      name: 'TT Shop PREMIUM Quận 1',
      phone: '0931823614',
      address: '20 Cao Bá Nhạ, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM'
    },
    {
      id: 3,
      name: 'TT Shop PREMIUM Quận 11',
      phone: '0828333223',
      address: '209 Âu Cơ, Phường 5, quận 11, Tp HCM'
    },
    {
      id: 4,
      name: 'TT Shop PREMIUM Bình Thạnh',
      phone: '0862327179',
      address: '284 Xô Viết Nghệ Tĩnh, P21, Quận Bình Thạnh, Tp.HCM'
    },
    {
      id: 5,
      name: 'TT Shop PREMIUM TP Thủ Đức',
      phone: '0767306363',
      address: '916 Kha Vạn Cân phường Trường Thọ TP Thủ Đức'
    },
    {
      id: 6,
      name: 'TT Shop Quận 1',
      phone: '0798684568',
      address: 'Số 6 Nguyễn Hữu Cầu Phường Tân Định Quận 1'
    }
  ];

  return (
    <div className="contact-page">
      <div className="contact-section">
        <div className="container">
          <div className="row">
            {/* Contact Info */}
            <div className="col-lg-5">
              <div className="contact-info">
                <h3 className="mb-4">Cửa Hàng TTShop</h3>
                
                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="contact-details">
                    <p className="address">268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM</p>
                    <p className="address">Việt Nam</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="contact-details">
                    <p>TTSports@gmail.com</p>
                    <p>Support.BadmintonStore@gmail.com</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-phone"></i>
                  </div>
                  <div className="contact-details">
                    <p>0368 238 582</p>
                    <p>0368 238 582</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="contact-details">
                    <p>Thứ 2 - Thứ 7: 8:00 - 21:00</p>
                    <p>Chủ nhật: 9:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-6">
              <div className="contact-form">
                <h2>Liên Hệ Với Chúng Tôi!</h2>
                <p className="form-description">
                  Chúng tôi luôn sẵn sàng tư vấn về các sản phẩm cầu lông và giải đáp mọi thắc mắc của bạn.
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Họ và tên"
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email của bạn"
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Chủ đề"
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      placeholder="Nội dung tin nhắn của bạn..."
                      className="form-control"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="btn btn-warning text-white"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Map Section */}
        <div className="map-section">
          <h2 className="section-title">Vị trí cửa hàng trên bản đồ</h2>
          <div className="map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3243915807803!2d106.66508907570653!3d10.785964889357469!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f1b7c3ed289%3A0xa06651894598e488!2zMjY4IMSQLiBMw70gVGjGsOG7nW5nIEtp4buHdCwgUGjGsOG7nW5nIDE0LCBRdeG6rW4gMTAsIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1733174826513!5m2!1svi!2s" 
              width="100%" 
              height="100%" 
              style={{border: 0}} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="TT Shop Location Map"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="section-title">Câu hỏi thường gặp</h2>
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <div 
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <h3>{faq.question}</h3>
                  <i className={`fas ${faq.open ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </div>
                <div className={`faq-answer ${faq.open ? 'open' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
  
  );
};

export default Contact;