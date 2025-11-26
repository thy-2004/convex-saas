# Hướng dẫn sử dụng Analytics & Metrics

## Tổng quan

Hệ thống Analytics đã được tích hợp tự động vào các actions chính của app. Mỗi khi có action quan trọng xảy ra, hệ thống sẽ tự động track và hiển thị trong tab Analytics.

## Events được track tự động

### 1. App Events
- ✅ **app_created** - Khi tạo app mới
  - Metadata: `{ name, region }`

### 2. User Events
- ✅ **user_created** - Khi tạo user mới
  - Metadata: `{ email, name }`
- ✅ **user_deleted** - Khi xóa user
  - Metadata: `{ email }`

### 3. Deployment Events
- ✅ **deployment_created** - Khi tạo deployment mới
  - Metadata: `{ name, region, url }`
- ✅ **deployment_deleted** - Khi xóa deployment
  - Metadata: `{ name }`

## Cách xem Analytics

1. Vào một app bất kỳ
2. Click tab **"Analytics"** ở trên cùng
3. Xem các metrics:
   - **Summary Stats**: API Calls, Errors, Active Users, Deployments
   - **Error Rate**: Tỷ lệ lỗi
   - **Charts**: Biểu đồ API Calls và Errors (14 ngày gần nhất)
   - **Recent Events**: Danh sách events gần đây

## Track Events thủ công (nếu cần)

Nếu bạn muốn track events tùy chỉnh từ client:

```typescript
import { useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";

const trackEvent = useMutation(api.analytics.trackEvent);

// Track một event
await trackEvent({
  appId: "your-app-id",
  eventType: "api_call", // hoặc "error", "custom_event", etc.
  metadata: {
    endpoint: "/api/users",
    method: "GET",
    statusCode: 200,
  },
});
```

## Event Types được hỗ trợ

- `api_call` - API calls (sẽ được aggregate thành `api_calls` metric)
- `error` - Errors (sẽ được aggregate thành `errors` metric)
- `user_login` - User login (sẽ được aggregate thành `active_users` metric)
- `deployment_created` - Deployment created
- `user_created` - User created
- `user_deleted` - User deleted
- `app_created` - App created
- Hoặc bất kỳ custom event type nào bạn muốn

## Metrics được tính tự động

Hệ thống tự động aggregate các events thành metrics theo ngày:
- `api_calls` - Tổng số API calls
- `errors` - Tổng số errors
- `active_users` - Số users active
- `deployments` - Số deployments

Metrics được lưu theo format `YYYY-MM-DD` để query nhanh.

## Lưu ý

- Events được track tự động khi bạn thực hiện các actions (create user, create deployment, etc.)
- Metrics được update tự động mỗi khi có event mới
- Data được lưu trong 2 bảng: `analyticsEvents` (chi tiết) và `analyticsMetrics` (tổng hợp)
- Tab Analytics hiển thị data của 30 ngày gần nhất

