### 🔄 后续计划

#### 1. 功能扩展
- 考虑添加通知分类筛选功能
- 优化通知中心的性能和加载速度
- 添加通知已读状态的批量操作

#### 2. 用户体验
- 考虑添加通知声音提醒
- 优化移动端通知显示
- 添加通知偏好设置功能
- 登录：记住账密 (已上线)
- 后续：加强本地存储安全（加密/有效期），可选提供“仅本次会话登录”策略

#### 3. 优化（积分系统）
- [x] 统一单位转换：替换手工 /10 或 *10 为 PointConverter（to_storage/to_display/format_for_api）
- [x] MallService 统计/摘要返回“显示值”，API 不再二次转换
- [x] 取消购买退款使用“存储值”入账（is_display_amount=False）并补充 company_id
- [ ] 全量代码扫描：移除任何残留手动换算逻辑，统一调用 PointConverter
- [ ] 单元/接口测试：覆盖 /api/redeemOrders、/api/mall/statistics、/api/mall/summary 等字段单位与小数位
- [ ] E2E 烟测脚本：Windows/PowerShell 一键验证关键接口单位、示例数据
