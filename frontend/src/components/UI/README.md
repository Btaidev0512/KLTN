# VNB Sports Logo Components

## 📋 Mô tả
Bộ logo components tùy chỉnh cho VNB Sports với nhiều variant và tùy chọn cá nhân hóa.

## 🎨 Các loại Logo

### 1. VNBLogo (Full Logo)
Logo đầy đủ với icon cầu lông và text, có gradient background chuyên nghiệp.

```tsx
import { VNBLogo } from '../UI';

<VNBLogo 
  width={160} 
  height={45}
  primaryColor="#e95211"
  secondaryColor="#ff6b35"
/>
```

### 2. SimpleVNBLogo
Logo đơn giản với icon outline và text, phù hợp cho header.

```tsx
import { SimpleVNBLogo } from '../UI';

<SimpleVNBLogo 
  width={140} 
  height={40}
  textColor="#e95211"
  accentColor="#ff6b35"
/>
```

### 3. TextLogo
Logo chỉ có text, phù hợp cho footer hoặc không gian nhỏ.

```tsx
import { TextLogo } from '../UI';

<TextLogo 
  width={120} 
  height={35}
  primaryColor="#e95211"
  secondaryColor="#ff6b35"
  showTagline={true}
/>
```

## 🎯 Props chính

| Prop | Type | Default | Mô tả |
|------|------|---------|--------|
| width | number | 160/140/120 | Chiều rộng logo |
| height | number | 45/40/35 | Chiều cao logo |
| className | string | '' | CSS class |
| primaryColor | string | '#e95211' | Màu chính |
| secondaryColor | string | '#ff6b35' | Màu phụ |

## 🌈 Color Presets

```tsx
import { logoColors } from '../UI';

// Sử dụng màu preset
<VNBLogo 
  primaryColor={logoColors.primary}
  secondaryColor={logoColors.secondary}
/>
```

Các màu có sẵn:
- `primary`: '#e95211' (Orange chính)
- `secondary`: '#ff6b35' (Orange phụ)
- `white`: '#ffffff'
- `dark`: '#333333'
- `light`: '#f8f9fa'

## 📏 Size Presets

```tsx
import { logoSizes } from '../UI';

// Sử dụng size preset
<VNBLogo {...logoSizes.medium} />
```

Các size có sẵn:
- `small`: { width: 100, height: 28 }
- `medium`: { width: 140, height: 40 }
- `large`: { width: 180, height: 50 }
- `xlarge`: { width: 220, height: 60 }

## 🎪 Demo Component

Để xem và test các logo variants:

```tsx
import LogoShowcase from '../UI/LogoShowcase';

<LogoShowcase />
```

## 📱 Responsive Usage

```css
/* CSS cho responsive logo */
.logo {
  height: 45px;
  max-width: 180px;
}

@media (max-width: 768px) {
  .logo {
    height: 35px;
    max-width: 140px;
  }
}

@media (max-width: 576px) {
  .logo {
    height: 30px;
    max-width: 120px;
  }
}
```

## 🎨 Customization Examples

### Logo với màu tùy chỉnh:
```tsx
<VNBLogo 
  primaryColor="#1a73e8"
  secondaryColor="#4285f4"
/>
```

### Logo cho dark theme:
```tsx
<SimpleVNBLogo 
  textColor="#ffffff"
  accentColor="#e95211"
/>
```

### Logo compact:
```tsx
<TextLogo 
  showTagline={false}
  width={80}
  height={25}
/>
```

## 🚀 Trong Header Component

Logo đã được tích hợp vào Header:

```tsx
// Header.tsx
<div className="logo-section">
  <Link to="/" className="logo-link">
    <VNBLogo 
      width={160} 
      height={45} 
      className="logo"
      primaryColor="#e95211"
      secondaryColor="#ff6b35"
    />
  </Link>
</div>
```

## ⚡ Performance Tips

- Logos được tạo bằng SVG nên scale tốt ở mọi resolution
- Sử dụng CSS transitions cho smooth hover effects  
- Optimize bằng cách chỉ import logos cần thiết
- Sử dụng presets để consistent branding

## 🎯 Best Practices

1. **Header**: Dùng VNBLogo hoặc SimpleVNBLogo
2. **Footer**: Dùng TextLogo với showTagline={false}
3. **Mobile**: Giảm size xuống còn small/medium
4. **Print**: Dùng màu dark (#333333) cho contrast tốt
5. **Social Media**: Dùng VNBLogo với square dimensions