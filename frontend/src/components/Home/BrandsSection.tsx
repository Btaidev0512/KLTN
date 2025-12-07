import React from 'react';
import Logo from '../UI/Logo';
import '../../styles/BrandsSection.css';

const BrandsSection: React.FC = () => {
  const brands = [
    {
      id: 1,
      name: 'Victor',
      logo: 'https://static.fbshop.vn/wp-content/uploads/2023/12/logo-500x500-1.jpg',
      position: 'x1'
    },
    {
      id: 2,
      name: 'Kumpoo',
      logo: 'https://static.fbshop.vn/wp-content/uploads/2023/12/Kumpoo-Australia-jpeg-1.png',
      position: 'x2'
    },
    {
      id: 3,
      name: 'Yonex',
      logo: 'https://static.fbshop.vn/wp-content/uploads/2023/12/Yonex-png-1.png',
      position: 'x3'
    },
   
    {
      id: 5,
      name: 'Mizuno',
      logo: 'https://static.fbshop.vn/wp-content/uploads/2023/12/Mizuno-Running-USA-png-1.png',
      position: 'x5'
    },
    {
      id: 6,
      name: 'Li-Ning',
      logo: 'https://static.fbshop.vn/wp-content/uploads/2023/12/Li-Ning-svg.png',
      position: 'x6'
    },
    {
      id: 7,
      name: 'Fleet',
      logo: 'https://static.fbshop.vn/wp-content/uploads/2023/12/tai-xuong-2-2.jpg',
      position: 'x7'
    },
   
    {
      id: 9,
      name: 'Proace',
      logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACUCAMAAABGFyDbAAAAwFBMVEX/////AAAAAADm5uaurq4xMTHExMT5AAD6+vrLy8vr6+uxsbHz8/Pw8PCnp6dbW1vV1dVtbW39wcNHR0dhYWGPj4/zAAA7Ozu8vLwaGhosLCxAQEAWFhZMTExycnL50NH5mZn2kZL88PH65uf3UlSenp4LCwt+fn7zsLLzpan4oKP4xMX3g4T4Dg/5Jib5S1DuU1X6Nzj4aGnzb3L7MDDvhIb62tvzOj7uLiz0eHryExnqWV/rt7raiYrhq7DuQkSMw5/YAAAEpUlEQVR4nO2a2WKqOhRA6cZCnHHCERUQi1NrHY+9g///VycEEWzVpC3Iy15PEmJYJDujShKCIAiCIAiCIAiCIAiCIAiCpAux7IE7mQ5NcziduK5tWVbaStZsMh8tdPUpRNVf37bTQWpqxHaX71GhKIvNcmKRx0vZk9UtpQB96doPllpvOE4+m+0DxXZrXUiKhdp89yCrw4ewlMfCfET4u2LNF+V1kLQUGfIC/RqqmayVNfqBlMc6yYa0f2r19LRPbhCz/LBS1dV8OJlMzcP+Gy36llR9WWtW/h93d3pzYu0Or8Jey4S0Dl5N7aufXE3h4WKbiNWMFf21Key9qNcsASuLPv3DvXaHmIIh9pGA1oTOvbeGxa2g19W3+h360+J2qVsxrVHsvXGg3g1ZsQ6pxj4LzZ82924PFkJecU9CZKVW72Y4CGkdY9ayRsv7s4ctFPV63FrvE06OtzS07FfeVFsVqa7Ytf7h5diJdMbYtf7l5RBaisWtJfGXSysBrbe4tfisBbR4/SYBBEau+Ed5PgK1tUph+y+gxe038SPQE+OeekTYcbe1aUQWf5RXE1gE8uEOW+s0rCxeZSWz7+FhcqzSGBv4q9NpGlKSdH+vqKYw6XjcnXjU+Dc8YtwNLL2aSlhJ5N7udZ9S+0nW8qaV+vHoI/Cz1PTWqbN6PDzqkPkL/93ogvrGrKb40489266Wx/dN0I7qx/t+uR4mcWT0XYhl72ZVn9nAttPpeAiCIAgSN7JTckqljEdWZik5+rFU8tO0Yphz527n8/l2Ovs6CSo050WCli85TinTkk/XpXwmQr7A1coCtJ8ZnR6084SldLpNBk2qKSwbcY/n1d/C/LTYy44BuvL5Uu734Nkwykat45coSQDj5zOdmizxoBJOTmZkG2OosJQWKTLk7Au9oLnsyz9nLC7PYprQL0M/uHLGUFbYg4ns9KDua9XlCPxFB5XIny/yAFmmFd43oEwkS3+fD9fHyFJ0GCnCAZBk75vBVViglGtDhXhaFa7JbS1auPNJq0xfl4ym3tKTzMMqixzHaG3ISNILdFkcagAv0fJlJftDrbNEgTZZwU8hPjJ9d02aBb/dmGF9hScfXVYfua6v8wLty+hnUK1CiJhWQ2lR8hnnGdoKSzEqPvUxNOhD/g9CnIT7i/MhQwmABVLLewGv0Y3cNa1es1ljGIYhpuX1xGa32+xWSsRPqffrHuVaDyr0IeHmYfRFizZhw/9UBqPoadWuahn5MxkxLYf2jVyBkDBFCe4qTWhGc4cHpodTikFjqeHhVMATfIHxZSPK2cJvQz5ICUM+aKIT586on9qV9l1aq4y64TWj1guHCg86XGjxa2mRqqOtGcRWcAIpd6AW3gYoF6SM15uj32/8eoD4qkWiD7GCk8k/wf65Dr1Ik7VY5kwHnhUvKEhR7oMfed5wmgv55nDKUC7GLTpMB4XYrAlVfeUGKXkI4t1/hzoAjfdcowtQo81Kp5y+bw2XXBlCPlFUWp9mKKIpkb6Uy2qBhOVOJm7Vjvw1UVOUixcvKgoblAo5zZvs83LhdLulXFCUEARBEARBEARBEARBEARBECRW/gIxK1uCpyK5lAAAAABJRU5ErkJggg==',
      position: 'x9'
    },
    {
      id: 10,
      name: 'Apacs',
      logo: 'data:image/png;base64,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',
      position: 'x10'
    }
  ];

  return (
    <section className="intro-brand">
      <div className="intro-brand-content">
        <div className="logo-wrapper">
          <Logo size="normal" showTagline={false} showShopText={true} />
        </div>
        <div className="title">
          Đồng hành cùng nhiều nhãn hàng <br /> uy tín trên thế giới
        </div>
        <div className="text">
          Chúng tôi hân hạnh trở thành đối tác phân phối <br /> của các nhãn hàng uy tín trên toàn thế giới
        </div>
      </div>

      {/* Floating Brand Logos */}
      {brands.map((brand) => (
        <div key={brand.id} className={`intro-brand-decor ${brand.position} pulsate-fwd`}>
          <img 
            src={brand.logo} 
            alt={brand.name}
            loading="lazy"
          />
        </div>
      ))}
    </section>
  );
};

export default BrandsSection;
