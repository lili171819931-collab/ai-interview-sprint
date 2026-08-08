# 03 · 数据模型与业务规则

> 实现位置：`ai-projects/products/weiji-mini/utils/{date,storage,habit}.js`

## 1. 存储结构

Key：`weiji_store_v1`

```json
{
  "habits": [
    {
      "id": "habit_...",
      "title": "喝水 1 杯",
      "description": "起身接一杯水",
      "color": "#1F7A6B",
      "icon": "水",
      "createdAt": 0,
      "archived": false,
      "targetPerDay": 1,
      "sortOrder": 0
    }
  ],
  "checkIns": [
    {
      "id": "check_...",
      "habitId": "habit_...",
      "date": "2026-08-08",
      "completedAt": 0
    }
  ],
  "prefs": { "firstLaunchDone": true }
}
```

## 2. 强制规则

1. **一日一次**：同 `habitId + date` 最多一条；再点 = 取消（需确认）  
2. **不允许补打**过去日期（MVP）  
3. **活跃上限 7**  
4. **归档** = `archived=true`（软删）；真删级联 checkIns  
5. **日期** = 设备本地 `YYYY-MM-DD`，00:00 切换今日  
6. **写失败必须可见提示**

## 3. Streak 策略 A（已选定 · 友好）

- 若**今日已打卡**：从今日向前连  
- 若**今日未打卡**：从**昨天**向前连（今日未完成不立刻把展示清零）  
- 详情页可标注「今日未打卡 · 连续天数截至昨天」

伪代码：

```
todayDone = exists(checkIn habitId, today)
cursor = todayDone ? today : yesterday
streak = 0
while exists(checkIn habitId, cursor):
  streak += 1
  cursor = cursor - 1 day
return streak, todayDone
```

## 4. 今日进度

```
active = habits where not archived
done = count(active with checkIn today)
percent = active==0 ? 0 : round(done/active*100)
```

## 5. 关键 API（逻辑层）

| 方法 | 作用 |
| --- | --- |
| `getTodayViewModel()` | 今日列表 + 进度 |
| `createHabit(payload)` | 校验 + 上限 + 写入 |
| `toggleCheckIn(habitId)` | 打卡/取消 |
| `calcStreak(habitId)` | 策略 A |
| `getMonthRecords(y, m)` | 月历数据 |
| `archiveHabit` / `deleteHabit` / `updateHabit` | 详情操作 |
