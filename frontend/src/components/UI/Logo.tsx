import React from "react";
import '../../styles/Logo.css';

interface LogoProps {
  size?: "normal" | "small";
  showTagline?: boolean;
  showShopText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = "normal",
  showTagline = true,
  showShopText = true,
}) => {
  return (
    <div className={`logo-container ${size === "small" ? "small" : ""}`}>
      <div className="logo">
        <div className="tt-mark">
          <span className="t first">T</span>
          <span className="t second">T</span>
        </div>
        {showShopText && <div className="shop-text">SHOP</div>}
      </div>
      {showTagline && <div className="tagline">Badminton Professional</div>}
    </div>
  );
};

export default Logo;
