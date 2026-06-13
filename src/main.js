import "./styles.css";

const GPA_FLOOR = 3.6;
const GPA_CEIL = 4.0;
const GPA_SWING_MULTIPLIER = 25;
const SEMESTER_FREE_WEEKS = 2;
const MIDTERM_WEEK = 1;
const FINAL_WEEK = 2;
const TOTAL_TALENT_POINTS = 25;
const YEARS = ["大一", "大二", "大三", "大四"];
const TOTAL_PROGRESS_STEPS = 4 * (2 * (SEMESTER_FREE_WEEKS + 2) + 1) + 1;

const state = {
  screen: "welcome",
  playerName: "未命名同学",
  gpa: 4.0,
  stamina: 85,
  mind: 80,
  health: 85,
  talents: {
    academic: 0,
    research: 0,
    management: 0,
    resilience: 0,
    empathy: 0
  },
  hidden: {
    knowledge: 0,
    research: 0,
    service: 0,
    network: 0,
    balance: 0,
    joy: 0
  },
  year: 0,
  semester: 0,
  week: 1,
  phase: "firstHalf",
  progress: 0,
  selectedAction: null,
  currentEvent: null,
  currentResponse: null,
  currentExamReport: null,
  currentAnnualReport: null,
  lastResult: null,
  archives: [],
  restReturnScreen: "week",
  forcedRest: false,
  locked: false
};

const talentDefs = [
  ["academic", "学业专精", "课内学习、备考效率提升；考试稳定性更高，琐事带来的 GPA 波动更小。"],
  ["research", "科研深耕", "课题组、硬件实验、项目研发消耗降低，科研进度获取效率提升。"],
  ["management", "统筹管理", "学生会、科协、班级多任务并行时，精力透支减少，紧急工作抗压增强。"],
  ["resilience", "身心韧性", "熬夜、高压、连续忙碌的身心损耗降低，休息恢复效率提升。"],
  ["empathy", "共情社交", "兄弟社交、情感生活、人际往来的正向收益提升，社交内耗减少。"]
];

const professorQuotes = [
  "工程不是把公式背下来，而是知道什么时候公式还能相信，什么时候该看波形。",
  "电路会说真话，示波器也会说真话，真正不稳定的往往是你以为已经想清楚的假设。",
  "不要怕 debug，debug 是电子系学生和现实世界第一次正式握手。",
  "系统的瓶颈不一定在最复杂的模块，很多时候藏在你没认真量过的接口上。",
  "会做题是输入阻抗，会做事是输出能力，中间还要有足够稳定的增益。"
];

const actions = [
  {
    id: "study",
    title: "深耕课内学习",
    desc: "刷题、预习、补作业、啃课程难点。知识储备上涨，GPA 更稳，但体力和精神会被课业密度持续消耗。",
    focus: "课内学习",
    eventType: "academic",
    delta: { gpa: 0.012, stamina: -13, mind: -7, health: -4, knowledge: 13, balance: -1 },
    talent: "academic"
  },
  {
    id: "research",
    title: "跟进科研任务",
    desc: "焊板、仿真、debug、读论文、准备组会。科研进度快速推进，但高强度动脑会挤占备考和睡眠。",
    focus: "科研项目",
    eventType: "research",
    delta: { gpa: -0.006, stamina: -8, mind: -14, health: -6, research: 14, knowledge: 4 },
    talent: "research"
  },
  {
    id: "service",
    title: "完成社会工作",
    desc: "活动筹备、部门统筹、赞助对接、班级事务推进。履历和人脉明显增长，但本周主业时间被压缩。",
    focus: "社会工作",
    eventType: "service",
    delta: { gpa: -0.008, stamina: -12, mind: -12, health: -3, service: 14, network: 8 },
    talent: "management"
  },
  {
    id: "sleep",
    title: "早睡休养调整",
    desc: "按时睡觉、运动、整理宿舍和节奏。体力健康快速回血，但学习、科研、工作进度基本停滞。",
    focus: "睡眠健康",
    eventType: "quiet",
    delta: { gpa: -0.004, stamina: 18, mind: 10, health: 17, balance: 9 },
    talent: "resilience"
  },
  {
    id: "friends",
    title: "维系兄弟社交",
    desc: "饭点聊天、球场放风、班级小聚、短途出游。人脉和情绪状态变好，但核心提升时间被占用。",
    focus: "兄弟社交",
    eventType: "friends",
    delta: { gpa: -0.006, stamina: -5, mind: 10, health: 2, network: 12, joy: 8, balance: 3 },
    talent: "empathy"
  },
  {
    id: "love",
    title: "休闲娱乐 / 情感相处",
    desc: "电影、散步、约会、游戏、独处发呆。精神解压最明显，但成长进度全面放缓，GPA 波动概率最高。",
    focus: "娱乐情感",
    eventType: "love",
    delta: { gpa: -0.012, stamina: 2, mind: 18, health: 3, joy: 14, network: 4, balance: 4 },
    talent: "empathy"
  }
];

const examStrategies = [
  {
    id: "cram",
    title: "通宵冲刺复习",
    desc: "把最后的时间全部压进刷题和背公式。GPA 上限更高，但体力、精神、健康都会明显受损。",
    delta: { gpa: 0.018, stamina: -16, mind: -13, health: -8, knowledge: 10 },
    talent: "academic"
  },
  {
    id: "steady",
    title: "稳态复盘错题",
    desc: "不赌极限发挥，专注错题、重点和基础盘。成绩稳中有升，身心损耗可控。",
    delta: { gpa: 0.01, stamina: -8, mind: -6, health: -3, knowledge: 8, balance: 4 },
    talent: "academic"
  },
  {
    id: "sleep",
    title: "保睡眠上考场",
    desc: "承认复习不会完美，优先保证睡眠和清醒度。GPA 小幅波动，但状态回稳。",
    delta: { gpa: -0.004, stamina: 8, mind: 7, health: 8, balance: 8 },
    talent: "resilience"
  },
  {
    id: "team",
    title: "组队互讲重点",
    desc: "和同学互相讲题、押重点、补盲区。知识与人脉都有收益，但讨论也会消耗精力。",
    delta: { gpa: 0.008, stamina: -7, mind: -5, health: -2, knowledge: 7, network: 8 },
    talent: "empathy"
  }
];

const eventBank = [
  event("academic", "任课老师课堂重点提点", "一节平平无奇的课突然亮了起来，老师顺手点出期末常见陷阱，你的笔记页边多了三颗星。", { gpa: 0.01, mind: 3, knowledge: 8 }, "追问推导细节", { knowledge: 5, mind: -2 }, "整理成复习卡片", { gpa: 0.006, stamina: -2 }),
  event("academic", "课程大作业突然加急 DDL", "群里弹出助教通知，原本下周的提交被提前。大家沉默了三秒，然后键盘声密集起来。", { gpa: -0.006, stamina: -10, mind: -9, knowledge: 4 }, "今晚硬刚完成", { stamina: -5, knowledge: 4 }, "找队友拆分任务", { network: 4, mind: -3 }),
  event("academic", "学长分享独家复习笔记", "学霸学长把压箱底的复习路线图发给你，还补了一句：别盲刷，先看结构。", { gpa: 0.012, mind: 5, knowledge: 9, network: 3 }, "当晚复盘吸收", { knowledge: 5, stamina: -3 }, "转给同班同学", { network: 5, mind: 2 }),
  event("academic", "随堂小测难度超纲", "题目看起来像从另一个宇宙空降，交卷时你开始重新审视本周的时间分配。", { gpa: -0.01, mind: -12, knowledge: 3 }, "课后补齐漏洞", { knowledge: 7, stamina: -5 }, "先稳住心态", { mind: 6, balance: 3 }),
  event("research", "实验调试一次成功", "示波器上的波形稳得像教科书截图，师兄路过都停下来确认了一眼。", { gpa: 0.002, mind: 8, research: 14, knowledge: 3 }, "记录完整参数", { research: 5, stamina: -2 }, "分享给小组", { network: 4, service: 2 }),
  event("research", "电路板焊板短路烧毁", "一股轻微焦味提醒你：现实硬件从不尊重侥幸。耗材没了，经验留下了。", { gpa: -0.006, stamina: -7, mind: -13, health: -3, research: 5 }, "复盘焊点路径", { research: 6, mind: -3 }, "请教师兄定位", { network: 4, research: 3 }),
  event("research", "课题组临时加开组会", "导师临时通知今晚组会，你把晚饭压缩成十分钟，把汇报压缩成三页。", { gpa: -0.004, stamina: -6, mind: -9, research: 8 }, "补做两张实验图", { research: 5, stamina: -4 }, "坦诚汇报阻塞点", { network: 3, mind: 2 }),
  event("research", "师兄手把手指导难点", "你卡了两天的 bug，被师兄用一句『这里时序不对』轻轻挑开。", { gpa: 0.004, mind: 6, research: 12, network: 4 }, "补写实验日志", { research: 5, knowledge: 3 }, "请杯咖啡感谢", { network: 5, joy: 2 }),
  event("service", "学生会突发活动筹备", "场地、物资、推送、嘉宾确认同时排队找你。本周的日程表被迫变成了作战图。", { gpa: -0.008, stamina: -12, mind: -10, service: 12, network: 5 }, "拉清单逐项推进", { service: 6, mind: -3 }, "请求部门支援", { network: 5, stamina: 2 }),
  event("service", "赞助洽谈顺利完成", "对方负责人点头的瞬间，你知道这不只是一次沟通，也是一次组织能力背书。", { gpa: 0.002, mind: 4, service: 12, network: 10 }, "复盘话术模板", { service: 4, knowledge: 2 }, "请团队吃夜宵", { network: 6, joy: 3, stamina: -2 }),
  event("service", "科协硬件活动落地", "从报名表到烙铁，从海报到安全提醒，活动现场终于跑起来了。", { gpa: -0.004, stamina: -8, mind: -5, service: 10, research: 5, network: 5 }, "沉淀活动流程", { service: 5 }, "认识参赛同学", { network: 6 }),
  event("service", "多部门工作堆叠", "三个群同时 @ 你，四个表格等你确认。你感觉自己像一台被不断切换上下文的处理器。", { gpa: -0.008, stamina: -10, mind: -14, health: -4, service: 8 }, "砍掉低优先级", { balance: 5, mind: 3 }, "继续全接全扛", { service: 6, stamina: -5, mind: -4 }),
  event("friends", "室友邀约短途旅行", "有人突然提议周末去看海。你想了想，人的缓存也需要清理。", { gpa: -0.006, stamina: -4, mind: 13, health: 4, network: 9, joy: 9 }, "痛快出发", { joy: 5, stamina: -3 }, "只参加半天", { balance: 5, gpa: 0.003 }),
  event("friends", "班级兄弟聚餐团建", "锅气、笑声和吐槽把一周的疲惫蒸散，大家说起作业时又同时叹气。", { gpa: -0.004, stamina: -3, mind: 10, network: 12, joy: 6 }, "多聊近况", { network: 5, mind: 2 }, "早点回宿舍", { health: 4, stamina: 3 }),
  event("friends", "队友邀约球类运动", "球场灯光下，身体终于从椅子里被解救出来。汗一出，焦虑也松了些。", { stamina: -5, mind: 8, health: 9, network: 5, joy: 4 }, "认真打一场", { health: 5, stamina: -4 }, "轻松活动一下", { mind: 3, health: 3 }),
  event("friends", "集体深夜卧谈", "熄灯后的聊天一路滑向人生、专业和未来，真诚，但第二天早八也是真的。", { gpa: -0.004, stamina: -8, mind: 9, health: -4, network: 8, joy: 5 }, "聊到尽兴", { network: 5, stamina: -4 }, "适时收住睡觉", { health: 5, balance: 4 }),
  event("family", "家中亲戚婚礼", "家里希望你回去露个面。高铁票、请假条和作业 DDL 在同一天聚到一起。", { gpa: -0.008, stamina: -8, mind: -4, health: -2, joy: 5, network: 3 }, "回家参加", { joy: 6, mind: 4, stamina: -5 }, "线上送祝福", { gpa: 0.004, mind: -2 }),
  event("family", "家人来访清华", "你带他们从二校门走到教学楼，讲得很轻松，心里却默默重排了本周任务。", { gpa: -0.005, stamina: -6, mind: 6, joy: 7 }, "认真陪同游玩", { joy: 5, health: -2 }, "晚上补一小时", { knowledge: 3, stamina: -3 }),
  event("family", "家庭电话谈心", "电话那头没有催促，只是问你最近睡得好不好。你忽然觉得肩膀轻了一点。", { mind: 14, health: 4, joy: 6, balance: 4 }, "多聊一会儿", { mind: 5, joy: 3 }, "聊完立刻规划", { balance: 4, knowledge: 2 }),
  event("family", "家中琐事牵挂", "一些细碎事情占着后台内存，你人在教室，注意力却偶尔飘回家里。", { gpa: -0.004, mind: -8, knowledge: 2 }, "主动沟通解决", { mind: 5, stamina: -2 }, "先记下晚点处理", { balance: 3 }),
  event("love", "和伴侣温馨相处", "湖边风很轻，你们聊了很多和绩点无关的事。世界短暂地从绩效表里退了出来。", { gpa: -0.006, stamina: 1, mind: 16, health: 3, joy: 12, network: 4 }, "完整留出时间", { joy: 6, mind: 4 }, "提前说好边界", { balance: 5, gpa: 0.002 }),
  event("love", "情感小矛盾磨合", "一句没解释清楚的话在心里绕了几圈。你发现亲密关系也需要调参。", { gpa: -0.006, mind: -12, health: -2, joy: 2 }, "认真沟通", { mind: 6, network: 4, stamina: -2 }, "独自冷静", { balance: 5, mind: 2 }),
  event("love", "独处冷静思考", "你没有急着打开任何软件，只是在校园里走了一圈，把混乱的念头归档。", { mind: 12, health: 5, balance: 8, joy: 5 }, "写下复盘", { balance: 5, knowledge: 2 }, "早点休息", { health: 6, stamina: 5 }),
  event("love", "收到暖心安慰", "一句『你已经做得很好了』比咖啡更醒脑。你重新捡起了桌上的草稿纸。", { gpa: 0.004, mind: 12, joy: 8, knowledge: 4 }, "继续推进任务", { knowledge: 4, stamina: -2 }, "表达感谢", { network: 4, joy: 3 }),
  event("academic", "助教临时开放答疑", "原本拥挤的知识点突然有了出口，答疑教室里每个人都在抢救自己的疑惑。", { gpa: 0.009, stamina: -4, mind: 2, knowledge: 8 }, "带着错题冲过去", { knowledge: 7, stamina: -3 }, "整理问题清单", { gpa: 0.004, balance: 3 }),
  event("academic", "实验课验收提前", "验收表被提前发出，你盯着还没完全稳定的波形，开始计算今晚还能榨出几小时。", { gpa: -0.007, stamina: -9, mind: -8, knowledge: 5 }, "补齐实验记录", { knowledge: 5, stamina: -4 }, "请队友交叉检查", { network: 4, gpa: 0.003 }),
  event("academic", "课堂点名讲题", "老师忽然点你上台解释思路。粉笔握在手里，脑子开始高速缓存。", { gpa: 0.006, mind: -4, knowledge: 6, network: 2 }, "硬着头皮讲完", { knowledge: 5, mind: -2 }, "课后补充订正", { gpa: 0.005, stamina: -2 }),
  event("research", "服务器排队终于轮到你", "训练任务排了两天，深夜突然弹出资源可用。机会来了，睡意也来了。", { gpa: -0.004, stamina: -8, mind: -6, research: 10 }, "趁热跑实验", { research: 7, health: -3 }, "先写好脚本明早跑", { balance: 4, health: 3 }),
  event("research", "论文精读卡在公式", "一段推导像墙一样挡住你。你看了三遍，终于承认这不是靠瞪能瞪懂的。", { gpa: 0.002, mind: -9, research: 7, knowledge: 5 }, "拆公式逐行推", { knowledge: 6, mind: -3 }, "约同学讨论", { network: 5, research: 3 }),
  event("research", "项目展示被老师追问", "展示结束前，老师连续追问边界条件。你意识到真正的项目不是能跑，而是能解释。", { gpa: -0.003, mind: -8, research: 9, knowledge: 4 }, "回去补实验", { research: 6, stamina: -4 }, "整理 Q&A 文档", { knowledge: 5, balance: 2 }),
  event("service", "部长临时请你救场主持", "麦克风递到你手里，流程单还没完全看熟。台下的目光让时间变得很具体。", { gpa: -0.005, stamina: -7, mind: -7, service: 10, network: 7 }, "稳定控场", { service: 6, network: 4 }, "事后复盘流程", { balance: 4, service: 3 }),
  event("service", "推送排版深夜返工", "一张图片尺寸错了，整篇推送的节奏都得重排。你和队友盯着预览页沉默。", { gpa: -0.006, stamina: -9, mind: -10, service: 8 }, "今晚改到上线", { service: 5, health: -3 }, "明确分工返修", { network: 4, mind: 2 }),
  event("friends", "兄弟临时拉你夜跑", "操场风声把脑内噪音一点点吹散。跑到第三圈时，你开始重新相信身体。", { stamina: -6, mind: 9, health: 10, network: 5, joy: 4 }, "多跑两圈", { health: 5, stamina: -4 }, "跑完拉伸回去", { balance: 4, health: 3 }),
  event("friends", "宿舍集体复盘人生方向", "有人想转算法，有人想做芯片，有人想先活过本周。聊着聊着，焦虑被摊平了一点。", { gpa: -0.003, mind: 8, network: 9, joy: 4 }, "认真听大家讲", { network: 5, mind: 3 }, "写下自己的路线", { balance: 5, knowledge: 2 }),
  event("family", "家里寄来一箱补给", "水果、零食和一张手写便签塞满纸箱。你突然想起，自己不是一个人在扛。", { mind: 11, health: 5, joy: 8 }, "分给室友一起吃", { network: 5, joy: 4 }, "打电话报平安", { mind: 5, balance: 2 }),
  event("love", "临时纪念日撞上 DDL", "日历提醒和课程 DDL 在同一天亮起。浪漫和责任都没有错，只是时间很窄。", { gpa: -0.008, mind: -5, joy: 6 }, "提前沟通改期", { balance: 6, mind: 3 }, "压缩任务赴约", { joy: 7, stamina: -5, gpa: -0.004 })
];

const eeSignalEvents = [
  event("academic", "信号与系统习题产生相位差", "卷积、傅里叶、拉普拉斯在草稿纸上排队，你突然理解了什么叫输入是周末，输出是头秃。", { gpa: -0.006, stamina: -6, mind: -7, knowledge: 8 }, "重画时域频域图", { knowledge: 7, mind: -2 }, "找同学互相讲一遍", { network: 4, knowledge: 4 }),
  event("academic", "模电小测考到偏置点", "题目一出来，你感觉自己的工作点也跟着漂移。稳住直流分析，才谈得上交流小信号。", { gpa: -0.008, mind: -8, knowledge: 7 }, "回去补晶体管模型", { knowledge: 8, stamina: -3 }, "整理易错参数", { gpa: 0.004, balance: 3 }),
  event("research", "FPGA 时序约束报红", "Vivado 的红字像夜色一样铺满屏幕。你知道这不是玄学，是路径、时钟和耐心的共同审判。", { gpa: -0.004, stamina: -8, mind: -10, research: 11 }, "逐条看 timing report", { research: 8, mind: -3 }, "请师兄看约束文件", { network: 5, research: 4 }),
  event("research", "示波器探头补偿没调好", "波形边沿看起来很奇怪，你差点开始怀疑人生，最后发现先该怀疑探头。", { gpa: -0.003, mind: -6, research: 8, knowledge: 5 }, "重新校准探头", { research: 5, knowledge: 3 }, "写进实验 checklist", { balance: 5 }),
  event("research", "焊台温度飘了", "锡点迟迟不上，板子却越来越烫。你第一次真切感到工艺参数也有脾气。", { stamina: -7, mind: -6, health: -3, research: 8 }, "换烙铁头重焊", { research: 5, stamina: -3 }, "停下来检查温控", { balance: 4, health: 3 }),
  event("service", "科协培训讲到 ADC 采样", "台下新生问混叠是什么，你忽然发现能把一件事讲明白，比自己会做更难。", { gpa: 0.002, stamina: -5, mind: -4, service: 9, knowledge: 5 }, "现场画采样示意", { service: 5, network: 4 }, "课后补充讲义", { knowledge: 4, stamina: -3 }),
  event("friends", "宿舍讨论芯片行业周期", "有人说先进制程，有人说模拟刚需，有人说先把明天的实验报告交了。现实和理想在桌边一起冒热气。", { gpa: -0.003, mind: 7, network: 8, knowledge: 3 }, "认真聊职业路线", { balance: 5, network: 4 }, "转回眼前作业", { knowledge: 4, stamina: -2 }),
  event("love", "约会地点改到电子系馆外", "你们在系馆外等风停，身后灯火像一块巨大的 PCB。浪漫有时也带一点松香味。", { gpa: -0.006, mind: 13, joy: 10, health: 2 }, "认真陪伴", { joy: 6, mind: 4 }, "约好晚点补进度", { balance: 4, gpa: 0.002 })
];

eventBank.push(...eeSignalEvents);

const annualEvents = [
  {
    title: "硬件设计大赛",
    desc: "大一的收官不是一张试卷，而是一块能不能稳定工作的板子。你和队友在实验室、宿舍、教学楼之间往返，把课堂知识第一次焊进现实。",
    key: "research",
    boosts: { research: 18, network: 8, knowledge: 8, service: 4 },
    cost: { stamina: -12, mind: -8, health: -4 }
  },
  {
    title: "电子系学生节",
    desc: "舞台、节目、灯光、推送、赞助、现场秩序同时展开。你发现所谓大型活动，靠的不是热血，而是无数细节不掉线。",
    key: "service",
    boosts: { service: 22, network: 16, joy: 8 },
    cost: { stamina: -14, mind: -11, health: -5 }
  },
  {
    title: "学生会核心统筹工作",
    desc: "从执行者到统筹者，压力不再只是自己能不能完成，而是整条链路能不能准时交付。你的判断、沟通和取舍被集中检验。",
    key: "service",
    boosts: { service: 24, network: 14, balance: 8, knowledge: 4 },
    cost: { stamina: -13, mind: -13, health: -6 }
  },
  {
    title: "毕业论文全程撰写",
    desc: "四年的课程、项目、组会和深夜复盘，最后收束成一篇完整的毕业论文。你站在终点前，把自己的 EE 轨迹讲清楚。",
    key: "knowledge",
    boosts: { knowledge: 18, research: 18, balance: 8 },
    cost: { stamina: -10, mind: -10, health: -5 }
  }
];

function event(type, title, desc, base, aText, aDelta, bText, bDelta) {
  return {
    type,
    title,
    desc,
    base,
    responses: [
      { text: aText, delta: aDelta },
      { text: bText, delta: bDelta }
    ]
  };
}

const app = document.querySelector("#app");

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function signed(num, fixed = 0) {
  const value = fixed ? num.toFixed(fixed) : Math.round(num);
  return `${num >= 0 ? "+" : ""}${value}`;
}

function applyDelta(rawDelta, sourceTalent) {
  const talent = sourceTalent ? state.talents[sourceTalent] || 0 : 0;
  const resilience = state.talents.resilience || 0;
  const adjusted = { ...rawDelta };

  for (const key of ["stamina", "mind", "health"]) {
    if (adjusted[key] < 0) {
      const talentShield = talent * 0.035;
      const resilienceShield = resilience * 0.018;
      adjusted[key] = Math.round(adjusted[key] * (1 - Math.min(0.42, talentShield + resilienceShield)));
    }
    if (adjusted[key] > 0 && sourceTalent === "resilience") {
      adjusted[key] = Math.round(adjusted[key] * (1 + talent * 0.035));
    }
  }

  for (const key of ["knowledge", "research", "service", "network", "balance", "joy"]) {
    if (adjusted[key] > 0 && sourceTalent) {
      adjusted[key] = Math.round(adjusted[key] * (1 + talent * 0.035));
    }
  }

  if (adjusted.gpa) {
    const academic = state.talents.academic || 0;
    adjusted.gpa = adjusted.gpa > 0
      ? adjusted.gpa * (1 + academic * 0.018)
      : adjusted.gpa * (1 - Math.min(0.35, academic * 0.025));
    adjusted.gpa *= GPA_SWING_MULTIPLIER;
    state.gpa = clamp(state.gpa + adjusted.gpa, GPA_FLOOR, GPA_CEIL);
  }

  for (const key of ["stamina", "mind", "health"]) {
    if (adjusted[key]) state[key] = clamp(state[key] + adjusted[key], 0, 100);
  }

  for (const key of Object.keys(state.hidden)) {
    if (adjusted[key]) state.hidden[key] = Math.max(0, state.hidden[key] + adjusted[key]);
  }

  return adjusted;
}

function randomEventForAction(action) {
  const aligned = eventBank.filter(item => item.type === action.id || item.type === action.focus || item.type === action.eventType);
  const candidates = aligned.length ? aligned : eventBank;
  if (Math.random() < 0.08) {
    return event("quiet", "没有突发事件的一周", "少见地，没有临时 DDL、没有深夜通知，也没有突然打乱节奏的人和事。平静本身，成了本周最奢侈的资源。", { mind: 4, balance: 5 }, "趁机整理节奏", { knowledge: 3, balance: 4 }, "给自己放半天假", { mind: 5, health: 3, joy: 3 });
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function render() {
  app.innerHTML = `
    <div class="game-shell">
      <canvas class="campus-canvas" id="campusCanvas"></canvas>
      <div class="grid"></div>
      <div class="noise"></div>
      <div class="scanline"></div>
      ${topbar()}
      ${timeline()}
      <main class="stage"><section class="page">${screen()}</section></main>
    </div>
  `;
  bind();
  drawCampus();
}

function topbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">EE</div>
        <div>
          <div class="brand-title">THUEE 模拟器</div>
          <div class="brand-subtitle">精英养成平衡模拟</div>
        </div>
      </div>
      <div class="player">
        <div class="player-label">当前玩家</div>
        <div class="player-name">${state.playerName}</div>
      </div>
      <div class="stats">
        ${stat("GPA", state.gpa, 4, state.gpa.toFixed(2), "")}
        ${stat("体力", state.stamina, 100, Math.round(state.stamina), "")}
        ${stat("精神", state.mind, 100, Math.round(state.mind), "mind")}
        ${stat("健康", state.health, 100, Math.round(state.health), "health")}
        ${warningBar()}
      </div>
    </header>
  `;
}

function stat(label, value, max, text, cls) {
  const danger = label !== "GPA" && value <= 0 ? "critical" : label !== "GPA" && value < 60 ? "warning" : "";
  return `
    <div class="stat-row ${danger}">
      <span class="stat-label">${label}</span>
      <div class="bar"><div class="bar-fill ${cls}" style="--value:${clamp(value / max * 100, 0, 100)}%"></div></div>
      <b>${text}</b>
    </div>
  `;
}

function warningBar() {
  const alerts = lowStatusAlerts();
  if (!alerts.length) return "";
  return `<div class="warning-strip">${alerts.map(item => `<span>${item}</span>`).join("")}</div>`;
}

function lowStatusAlerts() {
  return [
    ["体力", state.stamina],
    ["精神", state.mind],
    ["健康", state.health]
  ].filter(([, value]) => value < 60).map(([label, value]) => `${label}${value <= 0 ? "归零" : "低于60"}`);
}

function timeline() {
  return `
    <aside class="timeline" aria-hidden="true">
      ${Array.from({ length: TOTAL_PROGRESS_STEPS }, (_, i) => {
        const cls = i < state.progress ? "done" : i === state.progress ? "current" : "";
        return `<span class="dot ${cls}"></span>`;
      }).join("")}
    </aside>
  `;
}

function screen() {
  if (state.screen === "welcome") return welcomeScreen();
  if (state.screen === "name") return nameScreen();
  if (state.screen === "persona") return personaScreen();
  if (state.screen === "talents") return talentScreen();
  if (state.screen === "week") return weekScreen();
  if (state.screen === "event") return eventScreen();
  if (state.screen === "result") return resultScreen();
  if (state.screen === "exam") return examScreen();
  if (state.screen === "annual") return annualScreen();
  if (state.screen === "rest") return restScreen();
  return endingScreen();
}

function welcomeScreen() {
  const quote = professorQuotes[Math.floor(Math.random() * professorQuotes.length)];
  return `
    <div class="eyebrow">Admission Gateway</div>
    <h1>电子系开机广播</h1>
    <div class="quote-panel">
      <span>THUEE Boot Signal</span>
      <b>${quote}</b>
    </div>
    <p class="lead">示波器亮起，课表加载，四年的 EE 信号即将输入系统。接下来，每一页都只向前翻，不回退，不读档。</p>
    <div class="footer-actions"><button class="btn" data-action="to-name">进入新生登记</button></div>
  `;
}

function nameScreen() {
  return `
    <div class="eyebrow">Student Registry</div>
    <h1>开启你的 EE 四年人生</h1>
    <p class="lead">输入你的专属昵称。接下来，每一周都只有一个选择，每一页都不能回头；你不会被学业击穿，但体力、精神和健康会诚实记录每一次取舍。</p>
    <div class="form-row">
      <input class="input" id="nameInput" maxlength="14" placeholder="请输入你的专属昵称" autocomplete="off" />
      <button class="btn" data-action="confirm-name">开启四年历练</button>
    </div>
  `;
}

function personaScreen() {
  return `
    <div class="eyebrow">Freshman Profile</div>
    <h2>无 44 班新生档案</h2>
    <p class="lead">你是清华大学电子工程系无 44 班新生，年级前列精英底子，天赋出众、潜力十足。你的四年没有学业崩盘的风险，但会在电路实验、信号系统、焊板 debug、组会汇报、学生工作和真实生活之间反复取舍，度过独一无二的 EE 大学生涯。</p>
    <div class="meta-grid">
      <div class="metric"><span class="meta">GPA</span><b>4.0</b></div>
      <div class="metric"><span class="meta">体力</span><b>85</b></div>
      <div class="metric"><span class="meta">精神</span><b>80</b></div>
      <div class="metric"><span class="meta">健康</span><b>85</b></div>
    </div>
    <div class="footer-actions"><button class="btn" data-action="to-talents">进入天赋分配</button></div>
  `;
}

function talentScreen() {
  const used = Object.values(state.talents).reduce((sum, n) => sum + n, 0);
  const remain = TOTAL_TALENT_POINTS - used;
  return `
    <div class="eyebrow">Talent Allocation</div>
    <h2>25 点天赋，确认后永久锁定</h2>
    <p class="lead">五大天赋从 0 点起步。所有点数必须分配完毕，开局后不再修改。</p>
    <div class="talents">
      ${talentDefs.map(([id, name, effect]) => `
        <div class="talent">
          <div>
            <div class="talent-name">${name}</div>
            <div class="talent-effect">${effect}</div>
          </div>
          <div class="talent-controls">
            <button class="stepper" data-action="talent-dec" data-id="${id}" ${state.talents[id] <= 0 ? "disabled" : ""}>-</button>
            <b>${state.talents[id]}</b>
            <button class="stepper" data-action="talent-inc" data-id="${id}" ${remain <= 0 ? "disabled" : ""}>+</button>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="points">
      <div>剩余可分配点数：<span class="remaining">${remain}</span></div>
      <button class="btn" data-action="start-game" ${remain !== 0 ? "disabled" : ""}>确认开局</button>
    </div>
  `;
}

function weekScreen() {
  return `
    <div class="eyebrow">${currentStageLabel()}</div>
    <h2>本周只能选择一件最重要的事</h2>
    <p class="lead">这是浓缩学期中的平常周。课内学习、科研、社会工作、睡眠健康、兄弟社交、娱乐情感都在争夺同一块时间。选定后本周路线立即锁定。</p>
    <div class="grid-2">
      ${actions.map(action => `
        <button class="choice" data-action="choose-week" data-id="${action.id}">
          <div class="choice-title">${action.title}</div>
          <div class="choice-desc">${action.desc}</div>
        </button>
      `).join("")}
    </div>
  `;
}

function eventScreen() {
  const eventItem = state.currentEvent;
  return `
    <div class="eyebrow">Unexpected Event</div>
    <h2>${eventItem.title}</h2>
    <p class="lead">${eventItem.desc}</p>
    <div class="tag-row">
      <span class="tag">已选择：${state.selectedAction.title}</span>
      <span class="tag">${state.selectedAction.focus}</span>
      <span class="tag">${currentStageLabel()}</span>
    </div>
    <div class="grid-2">
      ${eventItem.responses.map((response, index) => `
        <button class="choice" data-action="choose-response" data-index="${index}">
          <div class="choice-title">${response.text}</div>
          <div class="choice-desc">将本周的突发事件纳入你的节奏，继续向前。</div>
        </button>
      `).join("")}
    </div>
  `;
}

function resultScreen() {
  const result = state.lastResult;
  return `
    <div class="eyebrow">Weekly Settlement</div>
    <h2>${result.title}</h2>
    <p class="lead">${result.summary}</p>
    <div class="results">
      <div>
        <div class="section-title">本次取舍</div>
        <div class="delta-list">
          ${result.deltas.map(delta => `
            <div class="delta">
              <span>${delta.label}</span>
              <b class="${delta.value >= 0 ? "up" : "down"}">${delta.text}</b>
            </div>
          `).join("")}
        </div>
      </div>
      <div>
        <div class="section-title">成长档案</div>
        <div class="archive">
          ${state.archives.slice(-5).reverse().map(item => `<div class="archive-item">${item}</div>`).join("")}
        </div>
      </div>
    </div>
    <div class="footer-actions"><button class="btn" data-action="advance">进入下一天 / 下一周</button></div>
  `;
}

function examScreen() {
  const type = state.phase === "midterm" ? "期中考试" : "期末考试";
  const report = state.currentExamReport;
  if (!report) return `
    <div class="eyebrow">Exam Week</div>
    <h2>${type}周：选择你的应考策略</h2>
    <p class="lead">考试周也不是自动播放。你需要决定是爆肝冲刺、稳态复盘、保睡眠，还是组队互讲。每种策略都会改变 GPA 与身心状态。</p>
    <div class="grid-2">
      ${examStrategies.map(strategy => `
        <button class="choice" data-action="choose-exam" data-id="${strategy.id}">
          <div class="choice-title">${strategy.title}</div>
          <div class="choice-desc">${strategy.desc}</div>
        </button>
      `).join("")}
    </div>
  `;
  return `
    <div class="eyebrow">Academic Review</div>
    <h2>${type}复盘</h2>
    <p class="lead">${report.summary}</p>
    <div class="results">
      <div class="delta-list">
        ${report.deltas.map(delta => `
          <div class="delta">
            <span>${delta.label}</span>
            <b class="${delta.value >= 0 ? "up" : "down"}">${delta.text}</b>
          </div>
        `).join("")}
      </div>
      <div>
        <div class="section-title">阶段判断</div>
        <p class="lead result-note">${report.note}</p>
      </div>
    </div>
    <div class="footer-actions"><button class="btn" data-action="finish-exam">继续向前</button></div>
  `;
}

function annualScreen() {
  const item = annualEvents[state.year];
  const rating = state.currentAnnualReport;
  return `
    <div class="eyebrow">Annual Milestone</div>
    <h2>${YEARS[state.year]}专属大活动：${item.title}</h2>
    <p class="lead">${item.desc}</p>
    <div class="meta-grid">
      <div class="metric"><span class="meta">综合判定</span><b>${rating.title}</b></div>
      <div class="metric"><span class="meta">知识</span><b>${Math.round(state.hidden.knowledge)}</b></div>
      <div class="metric"><span class="meta">科研</span><b>${Math.round(state.hidden.research)}</b></div>
      <div class="metric"><span class="meta">人脉</span><b>${Math.round(state.hidden.network)}</b></div>
    </div>
    <p class="lead result-note">${rating.text}</p>
    <div class="footer-actions"><button class="btn" data-action="finish-annual">完成年度节点</button></div>
  `;
}

function restScreen() {
  return `
    <div class="eyebrow">Forced Recovery</div>
    <h2>身体替你按下暂停键</h2>
    <p class="lead">连续的高压让体力、精神或健康触底。本周你无法继续硬扛，只能压缩安排、补觉、吃饭、复健，把人先拉回可运行状态。休养后将重来当前周，不会推进人生进度。</p>
    <div class="meta-grid">
      <div class="metric"><span class="meta">体力</span><b>+24</b></div>
      <div class="metric"><span class="meta">精神</span><b>+20</b></div>
      <div class="metric"><span class="meta">健康</span><b>+22</b></div>
      <div class="metric"><span class="meta">节奏</span><b>重整</b></div>
    </div>
    <div class="footer-actions"><button class="btn" data-action="finish-rest">休养后重来本周</button></div>
  `;
}

function endingScreen() {
  const ending = chooseEnding();
  const story = endingNarrative();
  return `
    <div class="eyebrow">Graduation</div>
    <h1>${ending.title}</h1>
    <p class="lead">${state.playerName}，四年 EE 生涯抵达终点。你没有把每件事都做到完美，却把一次次取舍累积成了自己的路径。${ending.text}</p>
    <div class="meta-grid">
      <div class="metric"><span class="meta">毕业 GPA</span><b>${state.gpa.toFixed(2)}</b></div>
      <div class="metric"><span class="meta">知识储备</span><b>${Math.round(state.hidden.knowledge)}</b></div>
      <div class="metric"><span class="meta">科研进度</span><b>${Math.round(state.hidden.research)}</b></div>
      <div class="metric"><span class="meta">社会人脉</span><b>${Math.round(state.hidden.network)}</b></div>
    </div>
    <div class="tag-row">
      <span class="tag">课内学习</span><span class="tag">科研项目</span><span class="tag">社会工作</span><span class="tag">睡眠健康</span><span class="tag">兄弟社交</span><span class="tag">娱乐情感</span>
    </div>
    <div class="ending-story">
      <div class="section-title">这段经历说明了什么</div>
      <p>${story.overview}</p>
      <p>${story.detail}</p>
    </div>
    <div class="footer-actions"><button class="btn secondary" data-action="restart">重新开局</button></div>
  `;
}

function bind() {
  document.querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", () => handle(el.dataset.action, el.dataset));
  });
  const input = document.querySelector("#nameInput");
  if (input) {
    input.focus();
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") handle("confirm-name", {});
    });
  }
}

function handle(action, data) {
  if (state.locked) return;
  if (action === "to-name") transition("name");
  if (action === "confirm-name") {
    const value = document.querySelector("#nameInput").value.trim();
    state.playerName = value || "无名 EE 人";
    transition("persona");
  }
  if (action === "to-talents") transition("talents");
  if (action === "talent-inc") {
    const used = Object.values(state.talents).reduce((sum, n) => sum + n, 0);
    if (used < TOTAL_TALENT_POINTS) state.talents[data.id] += 1;
    render();
  }
  if (action === "talent-dec") {
    state.talents[data.id] = Math.max(0, state.talents[data.id] - 1);
    render();
  }
  if (action === "start-game") {
    state.archives.push("人生无回头路，你的四年 EE 生涯正式开启。");
    transition("week");
  }
  if (action === "choose-week") {
    state.selectedAction = actions.find(item => item.id === data.id);
    state.currentEvent = randomEventForAction(state.selectedAction);
    transition("event");
  }
  if (action === "choose-response") {
    state.currentResponse = state.currentEvent.responses[Number(data.index)];
    settleWeek();
    transition("result");
  }
  if (action === "advance") advanceAfterResult();
  if (action === "choose-exam") {
    const strategy = examStrategies.find(item => item.id === data.id);
    const type = state.phase === "midterm" ? "期中考试" : "期末考试";
    state.currentExamReport = buildExamReport(type, strategy);
    transition("exam");
  }
  if (action === "finish-exam") finishExam();
  if (action === "finish-annual") finishAnnual();
  if (action === "finish-rest") {
    applyDelta({ stamina: 24, mind: 20, health: 22, balance: 8, gpa: -0.004 }, "resilience");
    state.archives.push(`强制休养完成：体力、精神与健康回升，当前周重新启动。`);
    if (state.restReturnScreen === "exam") state.currentExamReport = null;
    transition(state.restReturnScreen);
  }
  if (action === "restart") window.location.reload();
}

function transition(next) {
  const page = document.querySelector(".page");
  if (!page) {
    state.screen = next;
    render();
    return;
  }
  state.locked = true;
  page.classList.add("exit");
  setTimeout(() => {
    state.screen = next;
    state.locked = false;
    render();
  }, 210);
}

function settleWeek() {
  const before = snapshot();
  const actionDelta = applyDelta(state.selectedAction.delta, state.selectedAction.talent);
  const eventDelta = applyDelta(state.currentEvent.base, eventTalent(state.currentEvent.type));
  const responseDelta = applyDelta(state.currentResponse.delta, eventTalent(state.currentEvent.type));
  const after = snapshot();
  const deltas = diff(before, after);

  const summary = `你把本周押给了「${state.selectedAction.title}」，随后遇到「${state.currentEvent.title}」。选择「${state.currentResponse.text}」之后，主线继续前进：有些进度被推进，有些状态被透支。`;
  state.lastResult = {
    title: `${currentStageLabel()}结算`,
    summary,
    deltas,
    raw: { actionDelta, eventDelta, responseDelta }
  };
  state.archives.push(`${currentStageLabel()}：${state.selectedAction.title}；${state.currentEvent.title}；${state.currentResponse.text}。`);
}

function snapshot() {
  return {
    gpa: state.gpa,
    stamina: state.stamina,
    mind: state.mind,
    health: state.health,
    ...state.hidden
  };
}

function diff(before, after) {
  const map = [
    ["gpa", "GPA", 2],
    ["stamina", "体力", 0],
    ["mind", "精神", 0],
    ["health", "健康", 0],
    ["knowledge", "知识储备", 0],
    ["research", "科研进度", 0],
    ["service", "社会工作履历", 0],
    ["network", "人脉值", 0]
  ];
  return map
    .map(([key, label, fixed]) => ({ label, value: after[key] - before[key], text: signed(after[key] - before[key], fixed) }))
    .filter(item => Math.abs(item.value) > 0.001);
}

function advanceAfterResult() {
  if (state.stamina <= 0 || state.mind <= 0 || state.health <= 0) {
    state.restReturnScreen = "week";
    transition("rest");
    return;
  }
  state.progress += 1;
  transition(nextStageAfterStep());
}

function nextStageAfterStep() {
  if (state.phase === "firstHalf" && state.week >= MIDTERM_WEEK) {
    state.phase = "midterm";
    state.currentExamReport = null;
    return "exam";
  }
  if (state.phase === "secondHalf" && state.week >= FINAL_WEEK) {
    state.phase = "final";
    state.currentExamReport = null;
    return "exam";
  }
  state.week += 1;
  return "week";
}

function buildExamReport(type, strategy) {
  const before = snapshot();
  const academic = state.talents.academic;
  const knowledgeScore = state.hidden.knowledge * 0.0012;
  const condition = (state.stamina + state.mind + state.health) / 300;
  const examDelta = clamp(0.008 + academic * 0.0012 + knowledgeScore + condition * 0.012 - Math.random() * 0.012, -0.018, 0.034);
  const mindCost = type === "期末考试" ? -13 : -9;
  const staminaCost = type === "期末考试" ? -12 : -8;
  const strategyDelta = applyDelta(strategy.delta, strategy.talent);
  applyDelta({ gpa: examDelta, stamina: staminaCost, mind: mindCost, health: -3, knowledge: 5, balance: 2 }, "academic");
  const after = snapshot();
  const quality = examDelta > 0.018 ? "稳定发挥" : examDelta > 0.006 ? "稳住节奏" : "节奏需要调整";
  return {
    summary: `${type}结束。你选择了「${strategy.title}」。你没有被单次考试定义，而是在复盘中看见了这一阶段的时间分配：课程基础、身体状态和临场心态共同决定了这次表现。`,
    note: `${quality}。不足之处被记录为下一阶段的优化方向：更早拆解任务，更少临时硬扛，更主动地把恢复纳入计划。`,
    deltas: diff(before, after),
    strategy,
    raw: { strategyDelta }
  };
}

function finishExam() {
  if (state.stamina <= 0 || state.mind <= 0 || state.health <= 0) {
    state.restReturnScreen = "exam";
    transition("rest");
    return;
  }
  state.archives.push(`${YEARS[state.year]}第 ${state.semester + 1} 学期${state.phase === "midterm" ? "期中" : "期末"}复盘完成。`);
  state.progress += 1;
  state.currentExamReport = null;
  if (state.phase === "midterm") {
    state.phase = "secondHalf";
    state.week = 2;
    transition("week");
  } else {
    if (state.semester === 1) {
      state.currentAnnualReport = annualRating(annualEvents[state.year].key);
      transition("annual");
    }
    else {
      state.semester = 1;
      state.phase = "firstHalf";
      state.week = 1;
      transition("week");
    }
  }
}

function annualRating(key) {
  const item = annualEvents[state.year];
  const before = snapshot();
  const score = state.hidden[key] + state.hidden.network * 0.32 + state.hidden.balance * 0.24 + (state.talents.research + state.talents.management + state.talents.academic) * 1.6;
  applyDelta(item.boosts, annualTalent(key));
  applyDelta(item.cost, "resilience");
  const title = score > 210 ? "高光完成" : score > 145 ? "扎实完成" : "平稳完成";
  const text = score > 210
    ? "你在高压节点里交出了清晰、成熟且有辨识度的成果，这段经历会成为履历中的亮点。"
    : score > 145
      ? "你稳稳完成了关键节点，能力边界被向外推了一圈，也更清楚下一步该补哪里。"
      : "你顺利走完大型节点，没有留下遗憾。亮点不必每次都爆发，持续完成本身也是能力。";
  state.lastResult = { deltas: diff(before, snapshot()) };
  return { title, text };
}

function finishAnnual() {
  const item = annualEvents[state.year];
  state.archives.push(`${YEARS[state.year]}年度节点「${item.title}」完成。`);
  state.progress += 1;
  state.currentAnnualReport = null;
  if (state.year >= 3) {
    state.progress = TOTAL_PROGRESS_STEPS - 1;
    transition("ending");
    return;
  }
  state.year += 1;
  state.semester = 0;
  state.phase = "firstHalf";
  state.week = 1;
  transition("week");
}

function currentStageLabel() {
  const sem = state.semester === 0 ? "上" : "下";
  return `${YEARS[state.year]}${sem} 第 ${state.week} 周`;
}

function eventTalent(type) {
  return {
    academic: "academic",
    research: "research",
    service: "management",
    friends: "empathy",
    family: "empathy",
    love: "empathy",
    quiet: "resilience"
  }[type] || "resilience";
}

function annualTalent(key) {
  return {
    knowledge: "academic",
    research: "research",
    service: "management"
  }[key] || "resilience";
}

function chooseEnding() {
  const h = state.hidden;
  const balanceScore = h.balance + h.joy + state.stamina + state.mind + state.health;
  if (state.gpa >= 3.88 && h.knowledge > 330 && h.research > 260) {
    return { title: "EE 学术领航者", text: "你以扎实课内基础和持续科研积累，拿到了通往清华直博或海外顶尖深造的入场券。" };
  }
  if (h.research > 340 && h.knowledge > 230) {
    return { title: "顶尖硬件工程师", text: "硬件实操、项目经验和工程判断共同成型，半导体大厂顶薪 Offer 向你伸来。" };
  }
  if (h.service > 330 && h.network > 280) {
    return { title: "综合精英统筹者", text: "你把复杂协作练成了长期优势，高端管理、管培与组织型岗位都看见了你的稀缺性。" };
  }
  if (state.gpa >= 3.76 && balanceScore > 340 && h.knowledge > 220) {
    return { title: "均衡发展优等生", text: "你没有被单一路线绑架，而是在学业、生活和成长之间保持了漂亮的平衡，理想院校考研上岸。" };
  }
  if (balanceScore > 390) {
    return { title: "松弛成长追梦人", text: "你把身心状态守得很好，也稳步完成了专业成长，最终进入稳定优质的对口岗位。" };
  }
  return { title: "平平无奇顺利毕业", text: "没有夸张高光，也没有短板遗憾。你安稳走完四年 EE 生涯，带着清晰的自我认知毕业。" };
}

function endingNarrative() {
  const h = state.hidden;
  const strengths = [
    ["课内学习", h.knowledge],
    ["科研项目", h.research],
    ["组织统筹", h.service],
    ["人际连接", h.network],
    ["身心平衡", h.balance + h.joy]
  ].sort((a, b) => b[1] - a[1]);
  const top = strengths[0][0];
  const second = strengths[1][0];
  const pressure = [
    ["体力", state.stamina],
    ["精神", state.mind],
    ["健康", state.health]
  ].sort((a, b) => a[1] - b[1])[0];
  const gpaTone = state.gpa >= 3.9 ? "你把成绩维持在非常漂亮的位置，但满绩之后的正收益不会被保存，任何放松和挤占都会真实留下波动。"
    : state.gpa >= 3.75 ? "你的 GPA 经历过明显起伏，最后仍然保持在优秀区间，说明这四年并不是单纯刷分，而是在不断校准节奏。"
      : "你的 GPA 被多任务生活拉扯过，但始终守住了底线，成绩成为压力的读数，而不是失败的判决。";
  const overview = `这一局最突出的两条线是「${top}」和「${second}」。你不是沿着单一最优解前进，而是在平常周、考试周、年度节点之间反复切换工作点：有时像调电路一样追求稳定增益，有时又必须接受噪声、漂移和临时 DDL。`;
  const detail = `${gpaTone} 到毕业时，${pressure[0]}是最需要警惕的状态变量，说明真正的难度不在挂科，而在长期高压下怎样不把自己耗空。那些焊板、示波器、FPGA 时序、信号系统和组会里的选择，最后共同构成了你的 EE 版本成长曲线。`;
  return { overview, detail };
}

function drawCampus() {
  const canvas = document.querySelector("#campusCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.scale(dpr, dpr);
  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(68,217,255,.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.72);
  ctx.lineTo(w * 0.32, h * 0.52);
  ctx.lineTo(w * 0.52, h * 0.68);
  ctx.lineTo(w * 0.74, h * 0.42);
  ctx.lineTo(w * 0.94, h * 0.58);
  ctx.stroke();

  for (let i = 0; i < 18; i++) {
    const x = (i / 17) * w;
    const y = h * (0.74 + Math.sin(i * 1.7) * 0.05);
    ctx.fillStyle = i % 3 === 0 ? "rgba(93,242,166,.42)" : "rgba(68,217,255,.35)";
    ctx.fillRect(x, y, 4, 4);
  }

  ctx.strokeStyle = "rgba(255,255,255,.14)";
  for (let i = 0; i < 7; i++) {
    const x = w * 0.62 + i * 18;
    ctx.strokeRect(x, h * 0.2 + i * 4, 10, h * 0.28);
  }
}

window.addEventListener("resize", drawCampus);
render();
