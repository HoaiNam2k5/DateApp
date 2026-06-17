# TÀI LIỆU KỸ THUẬT

## 1. Tên dự án

Love Date Planner

## 2. Mục tiêu

Xây dựng ứng dụng hỗ trợ các cặp đôi lên kế hoạch hẹn hò. Người dùng có thể gửi lời mời đi chơi, lựa chọn món ăn yêu thích và nhận gợi ý địa điểm phù hợp dựa trên Google Places API.

---

# 3. Công nghệ sử dụng

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

## Backend

* Supabase

## Database

* PostgreSQL (Supabase)

## Authentication

* Supabase Auth
* Google Login

## Dịch vụ bên ngoài

* Google Places API
* Google Maps API

---

# 4. Chức năng chính

## Đăng nhập

* Đăng nhập bằng Google
* Quản lý hồ sơ cá nhân

## Gửi lời mời hẹn hò

* Chọn ngày giờ
* Gửi lời nhắn
* Gửi cho người yêu

## Phản hồi lời mời

* Đồng ý
* Từ chối

## Chọn món ăn

* Chọn một hoặc nhiều món ăn
* Lưu lịch sử lựa chọn

## Gợi ý địa điểm

* Tìm quán ăn theo món đã chọn
* Hiển thị đánh giá
* Hiển thị địa chỉ
* Hiển thị khoảng cách
* Chọn ngẫu nhiên địa điểm

## Lịch sử hẹn hò

* Xem các buổi hẹn đã diễn ra
* Xem món ăn đã chọn
* Xem địa điểm đã đi

---

# 5. Kiến trúc hệ thống

Người dùng
↓
Next.js
↓
Supabase Auth
↓
Supabase Database

↓

Google Places API
↓
Danh sách địa điểm gợi ý

---

# 6. Luồng hoạt động

1. Người dùng đăng nhập Google.
2. Tạo lời mời hẹn hò.
3. Người nhận đồng ý.
4. Người nhận chọn món ăn.
5. Hệ thống gọi Google Places API.
6. Hiển thị các quán phù hợp.
7. Chọn địa điểm cuối cùng.
8. Lưu kết quả vào lịch sử.
