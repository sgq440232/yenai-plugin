import plugin from '../../../lib/plugins/plugin.js'
import moment from 'moment';
import { Config } from '../components/index.js'
import { Cfg, Pixiv, common } from '../model/index.js'
//类型
let ranktype = new Pixiv().RankReg
let Numreg = "[一壹二两三四五六七八九十百千万亿\\d]+"
//正则
let listreg = new RegExp(`^#?看看((\\d{4}-\\d{1,2}-\\d{1,2})的)?(${Object.keys(ranktype).join("|")})(r18)?榜\\s?(第(${Numreg})页)?$`, "i")
let tagreg = new RegExp('^#?tag(pro)?搜图(.*)$', "i")
let pidreg = new RegExp('^#?pid搜图\\s?(\\d+)$', "i")
let uidreg = new RegExp('^#?uid搜图(.*)$', "i")
let randomimgreg = new RegExp(`^#?来(${Numreg})?张(好(康|看)(的|哒)|hkd|涩图)|#有内鬼$`)
let relatedreg = new RegExp(`^#?看?看?相关作品(\\d+)$`);
export class example extends plugin {
    constructor() {
        super({
            name: 'pixiv',
            event: 'message',
            priority: 500,
            rule: [
                {
                    reg: pidreg,
                    fnc: 'saucenaoPid'
                },
                {
                    reg: listreg,
                    fnc: 'pixivList'
                },
                {
                    reg: tagreg,
                    fnc: 'Tags'
                },
                {
                    reg: '^#?(查看|获取)?热门(t|T)(a|A)(g|G)$',
                    fnc: 'trend_tags'
                },
                {
                    reg: uidreg,
                    fnc: 'saucenaoUid'
                },
                {
                    reg: randomimgreg,
                    fnc: 'randomimg'
                },
                {
                    reg: relatedreg,
                    fnc: 'related_works'
                }
            ]
        })
    }

    //pid搜图
    async saucenaoPid(e) {
        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese) return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
        }

        await e.reply("你先别急，正在给你搜了(。-ω-)zzz")

        let regRet = pidreg.exec(e.msg)

        let res = await new Pixiv(e).Worker(regRet[1])

        if (!res) return;

        let { msg, img } = res

        await e.reply(msg)

        img.length == 1 || /R-18/.test(msg[4]) ? Cfg.recallsendMsg(e, img) : Cfg.getCDsendMsg(e, img, false)

        return true;
    }

    //p站排行榜
    async pixivList(e) {
        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese) return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
        }
        await e.reply("你先别急，马上去给你找哦ε(*´･ω･)з")

        let regRet = listreg.exec(e.msg)

        let day = moment().hour() >= 12 ? 1 : 2

        let date = moment().subtract(day, "days").format("YYYY-MM-DD")

        if (regRet[2]) date = regRet[2]

        let page = common.translateChinaNum(regRet[6] || "1")

        let res = await new Pixiv(e).Rank(page, date, regRet[3], !!regRet[4], regRet[2])

        if (!res) return

        Cfg.getCDsendMsg(e, res, false)

        return true;
    }

    /**关键词搜图 */
    async Tags(e) {
        let regRet = tagreg.exec(e.msg)

        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese || !Config.getGroup(e.group_id).sesepro && regRet[1]) {
                return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
            }
        }
        await e.reply("你先别急，正在给你搜了(。-ω-)zzz")

        let tag = regRet[2]

        let pagereg = new RegExp(`第(${Numreg})页`)

        let page = pagereg.exec(e.msg)

        if (page) {
            tag = tag.replace(page[0], "")
            page = common.translateChinaNum(page[1])
        } else {
            page = "1"
        }
        let res = null;
        if (regRet[1]) {
            res = await new Pixiv(e).searchTagspro(tag, page)
        } else {
            res = await new Pixiv(e).searchTags(tag, page)
        }
        if (!res) return
        Cfg.getCDsendMsg(e, res, false)

        return true;
    }
    /**获取热门tag */
    async trend_tags(e) {
        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese) return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
        }
        await e.reply("你先别急，马上去给你找哦ε(*´･ω･)з")

        let res = await new Pixiv(e).gettrend_tags()

        if (!res) return

        Cfg.getCDsendMsg(e, res, false)
    }

    /**以uid搜图**/
    async saucenaoUid(e) {
        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese) return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
        }
        await e.reply("你先别急，正在给你搜了(。-ω-)zzz")

        let regRet = uidreg.exec(e.msg)

        let key = regRet[1]

        let pagereg = new RegExp(`第(${Numreg})页`)

        let page = pagereg.exec(e.msg)

        if (page) {
            key = key.replace(page[0], "")
            page = page[1]
        } else {
            page = "1"
        }
        page = common.translateChinaNum(page)

        let res = await new Pixiv(e).public(key, page)

        if (!res) return

        Cfg.getCDsendMsg(e, res, false)
    }

    //随机原创插画
    async randomimg(e) {
        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese) return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
        }
        await e.reply("你先别急，马上去给你找哦ε(*´･ω･)з")

        let regRet = randomimgreg.exec(e.msg)

        let num = regRet[1] || 1
        if (num > 50) {
            e.reply("你要的太多辣，奴家只给你一张辣(•́へ•́ ╬)")
            num = 1
        }
        num = common.translateChinaNum(num)
        let res = await new Pixiv(e).getrandomimg(num);

        if (!res) return

        Cfg.getCDsendMsg(e, res, false)
    }

    //相关作品
    async related_works(e) {
        if (!e.isMaster) {
            if (!Config.getGroup(e.group_id).sese) return e.reply("主人没有开放这个功能哦(＊／ω＼＊)")
        }
        await e.reply("你先别急，马上去给你找哦ε(*´･ω･)з")
        let regRet = relatedreg.exec(e.msg)
        let msg = await new Pixiv(e).getrelated_works(regRet[1])
        if (!msg) return
        Cfg.getCDsendMsg(e, msg, false)
    }
}
