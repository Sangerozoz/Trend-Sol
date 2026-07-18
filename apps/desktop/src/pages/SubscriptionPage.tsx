/**
 * 订阅页 `/subscription`
 * MVP占位：套餐介绍 + "即将开放"
 */
export function SubscriptionPage() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">💎</div>
        <h1 className="text-xl font-bold text-text-primary mb-2">Trend IQ 会员</h1>
        <p className="text-sm text-text-muted mb-8">解锁无限 AI 解读、高级形态识别、多周期联合分析</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-bg-secondary rounded-lg border border-border-default p-6">
            <h3 className="text-sm font-medium text-text-primary mb-2">免费版</h3>
            <div className="text-2xl font-bold text-text-primary mb-3">¥0</div>
            <ul className="text-xs text-text-muted space-y-1 text-left">
              <li>✓ AI 自动画线</li>
              <li>✓ 形态识别</li>
              <li>✓ 自选股管理</li>
              <li>✓ 每日 5 次 AI 解读</li>
            </ul>
          </div>
          <div className="bg-bg-secondary rounded-lg border-2 border-accent p-6 relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-white text-xs px-2 py-0.5 rounded">推荐</div>
            <h3 className="text-sm font-medium text-text-primary mb-2">专业版</h3>
            <div className="text-2xl font-bold text-text-primary mb-3">即将开放</div>
            <ul className="text-xs text-text-muted space-y-1 text-left">
              <li>✓ 无限 AI 解读对话</li>
              <li>✓ 全部 14 种形态识别</li>
              <li>✓ 多周期联合分析</li>
              <li>✓ 持仓盈亏管理</li>
              <li>✓ 价格条件提醒</li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-text-muted">
          订阅功能即将上线，敬请期待
        </div>
      </div>
    </div>
  );
}
