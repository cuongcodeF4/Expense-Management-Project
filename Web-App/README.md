# 💰 Quản Lý Chi Tiêu

Ứng dụng quản lý tài chính cá nhân — Progressive Web App (PWA) triển khai trên Firebase.

## Tính năng

- 📊 **Bảng điều khiển** — Tóm tắt thu chi, biểu đồ theo tháng
- ➕ **Thêm giao dịch** — Thu nhập & Chi tiêu theo danh mục
- 📋 **Danh sách giao dịch** — Lọc, tìm kiếm, xóa
- 📈 **Biểu đồ & Thống kê** — Xu hướng thu chi, tiết kiệm, so sánh danh mục
- 🎯 **Ngân sách** — Đặt hạn mức chi tiêu theo danh mục
- 💾 **Xuất / Nhập dữ liệu** — Backup JSON
- 🔐 **Đăng nhập Google** — Dữ liệu đồng bộ đa thiết bị qua Firestore
- 📱 **PWA** — Cài trên điện thoại, hỗ trợ offline

## Yêu cầu

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

## Hướng dẫn triển khai

### 1. Tạo Firebase Project

Truy cập [console.firebase.google.com](https://console.firebase.google.com) → **Add project**

### 2. Bật Authentication → Google provider

**Authentication** → **Sign-in method** → **Google** → Enable

### 3. Tạo Firestore Database

**Firestore Database** → **Create database** → chọn **Production mode** → chọn region

### 4. Lấy Web App Config

**Project Settings** → **Your apps** → **Add app** → **Web** → Copy `firebaseConfig`

### 5. Điền config vào `public/assets/js/config.js`

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

### 6. Cập nhật `.firebaserc`

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 7. Đăng nhập Firebase CLI

```bash
firebase login
```

### 8. Deploy

```bash
firebase deploy
```

### 9. Truy cập ứng dụng

```
https://YOUR_PROJECT_ID.web.app
```

## Phát triển cục bộ

```bash
firebase serve
```

Truy cập tại: http://localhost:5000

## Cấu trúc Firestore

```
/users/{uid}/data/main   ← toàn bộ dữ liệu người dùng (1 document)
  {
    transactions: [...],
    budgets: {...},
    nextId: number
  }
```

Mỗi người dùng có 1 document chứa toàn bộ dữ liệu. Real-time sync qua `onSnapshot`.

## Ghi chú bảo mật

- Firestore Rules đảm bảo mỗi user chỉ đọc/ghi được dữ liệu của mình
- Offline persistence được bật tự động qua Firestore SDK
- Dữ liệu cũ từ localStorage sẽ được đề nghị migrate khi đăng nhập lần đầu
