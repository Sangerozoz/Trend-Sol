/**
 * 我的页 `/profile`
 * 持仓管理 + 盈亏统计（自写 Tailwind）+ 条件单（Arco Design 组件演示）
 *
 * 说明：「条件单」模块使用 Arco Design 的
 *   - Table（表格）
 *   - Modal（弹窗）
 *   - Form / Input / InputNumber / Select / TextArea（表单）
 *   - DatePicker（日期选择器）
 *   - IconPlus / IconBell / IconDelete（图标库）
 * 以验证 Arco 在纯黑主题下的观感。数据仅本地 state，未接后端。
 */
import { useState } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  Message,
  Tag,
  type ColumnProps,
} from "@arco-design/web-react";
import { IconPlus, IconNotification, IconDelete } from "@arco-design/web-react/icon";

const { TextArea } = Input;

interface ConditionOrder {
  id: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  triggerDate: string;
  note: string;
  status: "active" | "triggered";
}

// 演示用种子数据（让表格一进来就有内容）
const SEED: ConditionOrder[] = [
  {
    id: "seed-1",
    symbol: "600519",
    condition: "above",
    targetPrice: 1850.0,
    triggerDate: "2026-07-20",
    note: "突破前高提醒",
    status: "active",
  },
  {
    id: "seed-2",
    symbol: "300750",
    condition: "below",
    targetPrice: 168.5,
    triggerDate: "2026-07-18",
    note: "回踩支撑提醒",
    status: "active",
  },
];

export function ProfilePage() {
  const [data, setData] = useState<ConditionOrder[]>(SEED);
  const [visible, setVisible] = useState(false);
  const [triggerDate, setTriggerDate] = useState("");
  const [form] = Form.useForm();

  const closeModal = () => {
    setVisible(false);
    setTriggerDate("");
    form.resetFields();
  };

  const handleSubmit = (values: Record<string, any>) => {
    if (!triggerDate) {
      Message.warning("请选择触发日期");
      return;
    }
    const record: ConditionOrder = {
      id: Date.now().toString(),
      symbol: String(values.symbol).trim(),
      condition: values.condition,
      targetPrice: Number(values.targetPrice),
      triggerDate,
      note: values.note ?? "",
      status: "active",
    };
    setData((prev) => [record, ...prev]);
    Message.success(`已创建条件单：${record.symbol}`);
    closeModal();
  };

  const remove = (id: string) => {
    setData((prev) => prev.filter((d) => d.id !== id));
    Message.success("已删除条件单");
  };

  const columns: ColumnProps<ConditionOrder>[] = [
    { title: "股票", dataIndex: "symbol", width: 110 },
    {
      title: "条件",
      dataIndex: "condition",
      width: 100,
      render: (v: string) =>
        v === "above" ? <Tag color="red">涨破</Tag> : <Tag color="green">跌破</Tag>,
    },
    {
      title: "目标价",
      dataIndex: "targetPrice",
      width: 130,
      render: (v: number) => <span className="font-mono">¥{v.toFixed(2)}</span>,
    },
    { title: "触发日期", dataIndex: "triggerDate", width: 150 },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (v: string) =>
        v === "active" ? <Tag color="blue">监控中</Tag> : <Tag color="gray">已触发</Tag>,
    },
    {
      title: "操作",
      width: 90,
      render: (_: unknown, record: ConditionOrder) => (
        <Button
          type="text"
          size="small"
          status="danger"
          icon={<IconDelete />}
          onClick={() => remove(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 max-w-3xl mx-auto space-y-4">
      {/* 持仓管理 */}
      <section className="bg-bg-secondary rounded-lg border border-border-default p-4">
        <h2 className="text-sm font-medium text-text-primary mb-3">持仓管理</h2>
        <div className="text-xs text-text-muted">
          手动输入持仓（股票代码 + 数量 + 成本价），自动计算盈亏
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          <input
            placeholder="代码"
            className="px-2 py-1 bg-bg-tertiary rounded border border-border-default text-text-primary"
          />
          <input
            placeholder="数量"
            type="number"
            className="px-2 py-1 bg-bg-tertiary rounded border border-border-default text-text-primary"
          />
          <input
            placeholder="成本价"
            type="number"
            className="px-2 py-1 bg-bg-tertiary rounded border border-border-default text-text-primary"
          />
          <button className="px-2 py-1 bg-accent text-white rounded hover:bg-accent/80">
            添加
          </button>
        </div>
        <div className="mt-3 text-xs text-text-muted text-center py-4">暂无持仓记录</div>
      </section>

      {/* 盈亏统计 */}
      <section className="bg-bg-secondary rounded-lg border border-border-default p-4">
        <h2 className="text-sm font-medium text-text-primary mb-3">盈亏统计</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-text-muted">总盈亏</div>
            <div className="text-lg font-mono text-text-muted">--</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">今日盈亏</div>
            <div className="text-lg font-mono text-text-muted">--</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">月度盈亏</div>
            <div className="text-lg font-mono text-text-muted">--</div>
          </div>
        </div>
      </section>

      {/* 条件单（Arco Design 组件） */}
      <section className="bg-bg-secondary rounded-lg border border-border-default p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-primary flex items-center gap-1.5">
            <IconNotification />
            条件单（价格提醒）
          </h2>
          <Button type="primary" icon={<IconPlus />} onClick={() => setVisible(true)}>
            新建条件单
          </Button>
        </div>

        <Table<ConditionOrder>
          rowKey="id"
          columns={columns}
          data={data}
          size="small"
          border={{ wrapper: true, cell: true }}
          pagination={data.length > 8 ? { pageSize: 8 } : false}
        />
      </section>

      {/* 新建条件单弹窗 */}
      <Modal
        title={
          <Space>
            <IconNotification />
            <span>新建条件单</span>
          </Space>
        }
        visible={visible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        okText="创建"
        cancelText="取消"
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <Form.Item
            label="股票代码"
            field="symbol"
            rules={[{ required: true, message: "请输入股票代码" }]}
          >
            <Input placeholder="如 600519 / AAPL" allowClear />
          </Form.Item>

          <Form.Item label="触发条件" field="condition" initialValue="above">
            <Select
              options={[
                { label: "涨破目标价", value: "above" },
                { label: "跌破目标价", value: "below" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="目标价格"
            field="targetPrice"
            rules={[{ required: true, message: "请输入目标价格" }]}
          >
            <InputNumber
              min={0}
              precision={2}
              placeholder="0.00"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item label="触发日期">
            <DatePicker
              style={{ width: "100%" }}
              onChange={(_, dateStr) => setTriggerDate(dateStr ?? "")}
            />
          </Form.Item>

          <Form.Item label="备注" field="note">
            <TextArea placeholder="可选" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
