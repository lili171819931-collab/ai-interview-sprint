# 国内三平台热点报告

- 生成时间：2026-08-10T20:07:19+08:00
- 工具：Scrapling + 本地降级

## 平台抓取状态

- **weibo**：mode=`live:weibo-ajax`，条目=30
- **xiaohongshu**：mode=`live:xhs-explore`，条目=20；注：网页热榜常需登录；本脚本用探索页 SSR 公开笔记作热点近似。
- **weixin_channels**：mode=`live:douyin-proxy-for-channels`，条目=20；注：微信视频号无稳定公开官方热榜 API；本脚本用抖音热搜作短视频侧公开代理，并叠加「视频号」关键词弱相关话题（若有）。不可当作视频号官方榜。

## 十大类热点（每类最多 3 条）

### 社会民生（命中 47）
- [1] 上海暴雨 · 热度:短视频榜位#1 · 平台:weixin-channels-proxy-douyin · [来源](https://www.douyin.com/hot/2603779)
- [2] 白海豚突然大拐弯 · 热度:2496204 · 平台:weibo · [来源](https://s.weibo.com/weibo?q=%23%E7%99%BD%E6%B5%B7%E8%B1%9A%E7%AA%81%E7%84%B6%E5%A4%A7%E6%8B%90%E5%BC%AF%23&Refer=top)
- [2] 听说空调不建议来回关，给大家试了一下，一会关一会开，还不如一直开着，按26档省电 · 热度:点赞 2179 · 平台:xiaohongshu · [来源](https://www.xiaohongshu.com/explore/6a582ffc000000000f004b39)

### 娱乐明星（命中 12）
- [1] 百花奖闭幕式 · 热度:4433909 · 平台:weibo · [来源](https://s.weibo.com/weibo?q=%23%E7%99%BE%E8%8A%B1%E5%A5%96%E9%97%AD%E5%B9%95%E5%BC%8F%23&Refer=top)
- [6] 百花奖内场座位图 · 热度:1007833 · 平台:weibo · [来源](https://s.weibo.com/weibo?q=%23%E7%99%BE%E8%8A%B1%E5%A5%96%E5%86%85%E5%9C%BA%E5%BA%A7%E4%BD%8D%E5%9B%BE%23&Refer=top)
- [9] 女演员炒股亏70万靠年迈母亲接济 · 热度:765779 · 平台:weibo · [来源](https://s.weibo.com/weibo?q=%23%E5%A5%B3%E6%BC%94%E5%91%98%E7%82%92%E8%82%A1%E4%BA%8F70%E4%B8%87%E9%9D%A0%E5%B9%B4%E8%BF%88%E6%AF%8D%E4%BA%B2%E6%8E%A5%E6%B5%8E%23&Refer=top)

### 科技数码（命中 6）
- [7] 别再用这个姿势玩手机了 · 热度:984000 · 平台:weibo · [来源](https://s.weibo.com/weibo?q=%23%E5%88%AB%E5%86%8D%E7%94%A8%E8%BF%99%E4%B8%AA%E5%A7%BF%E5%8A%BF%E7%8E%A9%E6%89%8B%E6%9C%BA%E4%BA%86%23&Refer=top)
- [10] 多位大疆员工离职后创业成功 · 热度:764120 · 平台:weibo · [来源](https://s.weibo.com/weibo?q=%23%E5%A4%9A%E4%BD%8D%E5%A4%A7%E7%96%86%E5%91%98%E5%B7%A5%E7%A6%BB%E8%81%8C%E5%90%8E%E5%88%9B%E4%B8%9A%E6%88%90%E5%8A%9F%23&Refer=top)
- [12] 宇树科技今日申购 · 热度:短视频榜位#12 · 平台:weixin-channels-proxy-douyin · [来源](https://www.douyin.com/hot/2603801)

### 财经商业（命中 0）
- （本轮无命中）
### 体育赛事（命中 2）
- [6] 世界杯 · 热度:点赞 1541 · 平台:xiaohongshu · [来源](https://www.xiaohongshu.com/explore/6a5c0698000000001d00cc57)
- [16] 全场沸腾！佛得角打进世界杯历史首粒进球！ · 热度:点赞 2万 · 平台:xiaohongshu · [来源](https://www.xiaohongshu.com/explore/6a38681b0000000006035747)

### 国际时政（命中 1）
- [3] APEC经济体来华热度持续攀升 · 热度:短视频榜位#3 · 平台:weixin-channels-proxy-douyin · [来源](https://www.douyin.com/hot/2604571)

### 生活消费（命中 1）
- [7] 穿搭天才依旧稳定发挥 · 热度:短视频榜位#7 · 平台:weixin-channels-proxy-douyin · [来源](https://www.douyin.com/hot/2604130)

### 影视综艺（命中 0）
- （本轮无命中）
### 游戏电竞（命中 0）
- （本轮无命中）
### 健康教育（命中 1）
- [1] 🇨🇦加拿大球员Ismaël Koné到医院手术了🥺 · 热度:点赞 9430 · 平台:xiaohongshu · [来源](https://www.xiaohongshu.com/explore/6a34b95b00000000220196e7)

## 下一步趋势

1. **类目升温**：社会民生、娱乐明星、科技数码
   - 下一步：内容侧优先做情绪/现场/解释型短内容；产品侧观察是否可沉淀为选题模板。
   - 依据：类目计数 Top: {'社会民生': 31, '娱乐明星': 7, '科技数码': 3, '健康教育': 1, '体育赛事': 1}
2. **跨平台共振**：演员秦焰去世
   - 下一步：优先做二次解读与事实核对，避免纯搬运；可进入机会简报候选池。
   - 依据：同一标题在 ≥2 个数据源出现
3. **平台分工**：微博偏突发/娱乐热搜；小红书偏种草与生活方式笔记
   - 下一步：同一话题做「微博追热 → 小红书种草拆解 → 视频号口播解释」三段式分发。
   - 依据：样本 weibo=30 xhs=20
4. **视频号能力边界**：官方热榜不可稳定公开抓取
   - 下一步：下阶段：账号矩阵手工采样 / 合作数据商 / 或用公开短视频榜作对照，不伪造视频号官方排名。
   - 依据：本报告短视频侧使用抖音公开代理
5. **类目缺口**：财经商业、影视综艺、游戏电竞
   - 下一步：扩大关键词映射或补充垂直源（体育/教育垂类榜）。
   - 依据：本轮十大类中无命中话题
