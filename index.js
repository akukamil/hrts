var M_WIDTH=800, M_HEIGHT=450;
var app ={stage:{},renderer:{}}, assets={}, SERVER_TM=0,fbs,client_id, objects={}, state="", my_role="", game_tick=0, made_moves=0, my_turn=0, connected = 1, LANG = 0, min_move_amount=0, h_state=0, game_platform="",git_src='', ROOM_NAME = '', g_board=[], players="",moving_chip=null, pending_player="",tm={}, some_process={}, my_data={opp_id : ''},opp_data={}, game_name='hearts';
const WIN = 1, DRAW = 0, LOSE = -1, NOSYNC = 2;
const MAX_NO_AUTH_RATING=1950;
const MAX_NO_REP_RATING=1910;
const MAX_NO_CONF_RATING=1950;
const NUM_OF_PLAYERS=4;
const HAND_SIZE=13;
const COM_URL='https://akukamil.github.io/com'

const EVENTS={
	INIT_GAME:0,
	PASSING_START:1,
	PASSING_FIN:2,
	MOVE:3,
	TRICK_START:4,
	TRICK_FIN:5	,
	MOVE_FROM_PLAYER:6
}


//создаем массив карт
let iter_index=0
const suits = ['h', 'd', 's', 'c']
const rusSuits={h:'Червы',d:'Бубны',s:'Пики',c:'Трефы'}
const suitSortVal={'h':60, 'd':20, 's':40, 'c':0}
const cards_lib = []
for (let suitIndex = 0; suitIndex < suits.length; suitIndex++) {
    for (let value = 2; value <= 14; value++) {
        cards_lib.push({ suit: suits[suitIndex],val: value,index:iter_index});
		iter_index++
    }
}

const TWO_OF_CUBES_INDEX=cards_lib.findIndex(c=>{return c.suit==='c'&&c.val===2});
const QUEEN_OF_SPADES_INDEX=cards_lib.findIndex(c=>{return c.suit==='s'&&c.val===12});

let TM={s:0,ms:0}

function randIntInc(min,max){
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1) + min)
}

class playing_card_class extends PIXI.Container{

	constructor(){
		
		super()
		this.bcg=new PIXI.Sprite(assets.playingCardBcgImg)
		this.bcg.anchor.set(0.5,0.5)
		this.bcg.width=90
		this.bcg.height=110
		
		this.bcg.interactive=true
		this.bcg.buttonMode=true
		const t=this
		this.bcg.pointerdown=function(){game.cardDown(t)}
			
			
		this.recFlagIcon=new PIXI.Sprite(assets.recCardFlagImg)	
		this.recFlagIcon.anchor.set(0.5,0.5)
		this.recFlagIcon.width=30
		this.recFlagIcon.height=30
		this.recFlagIcon.x=-23
		this.recFlagIcon.y=-34
		this.recFlagIcon.visible=false
		
		this.valIcon=new PIXI.Sprite()	
		this.valIcon.anchor.set(0.5,0.5)
		this.valIcon.width=50
		this.valIcon.height=50
		this.valIcon.y=-20
		
		this.suitIcon=new PIXI.Sprite()	
		this.suitIcon.anchor.set(0.5,0.5)
		this.suitIcon.width=50
		this.suitIcon.height=50
		this.suitIcon.y=20
		
		
		this.playerIndex=-1
		this.cardData=0
		this.passingCard=0
		this.sortVal=0
		//this.scale_xy=0.5;
		this.addChild(this.bcg,this.recFlagIcon,this.valIcon,this.suitIcon)
	}
	
	setOpen(isOpen){
		
		if (isOpen){
			
			this.bcg.texture=assets.playingCardBcgImg
			this.valIcon.visible=true
			this.suitIcon.visible=true
			//this.recFlagIcon.visible=true
			
		}else{
			this.bcg.texture=assets.playingCardShirtImg
			this.valIcon.visible=false
			this.suitIcon.visible=false
			this.recFlagIcon.visible=false
		}
		
		
	}
	
	setCard(cardData){
		
		//если это индекс то превращаем в данные
		if (Number.isFinite(cardData))
			cardData=cards_lib[cardData]
		
		this.cardData=cardData
		
		this.sortVal=suitSortVal[cardData.suit]+cardData.val
		
		this.suitIcon.texture=assets['cards_symbols2'][this.cardData.suit]
		this.valIcon.texture=assets['cards_symbols2'][this.cardData.val]
		this.visible=true
		this.alpha=1
	}

}

class player_card_class extends PIXI.Container{

	constructor(params={}){
		
		super()
		
		this.index=params.index
		this.playerIndex=0
		
		this.x=params.x
		this.y=params.y
		
		//место где должен находится таймер
		this.timerPlace_x=objects.pCardsTimerPlaces[params.index].x
		this.timerPlace_y=objects.pCardsTimerPlaces[params.index].y
		
		this.photo=new PIXI.Graphics()
		this.photo.clear()
		this.photo.beginFill(0x333355)
		//this.photo.drawCircle(0,0,params.w*0.5)
		this.photo.h=params.w
		this.photo.w=params.w
		this.photo.x=-params.w*0.5
		this.photo.y=-params.w*0.5
		
		this.photoFrame=new PIXI.Sprite(assets.avatarFrameImg)
		this.photoFrame.width=params.w+20
		this.photoFrame.height=params.w+20
		this.photoFrame.x=-10-params.w*0.5
		this.photoFrame.y=-10-params.w*0.5
		
		this.photoBcg=new PIXI.Sprite(assets.avatarBcgImg)
		this.photoBcg.width=params.w+20
		this.photoBcg.height=params.w+20
		this.photoBcg.x=-10-params.w*0.5
		this.photoBcg.y=-10-params.w*0.5
					
		this.tName=new PIXI.BitmapText('', {fontName: 'bahnschrift48s',fontSize: 20})
		this.tName.tint=0xFFFF00
		
		this.tRating=new PIXI.BitmapText('', {fontName: 'bahnschrift48s',fontSize: 20})
		this.tRating.tint=0xC2F1C8
		
		this.tScore=new PIXI.BitmapText('', {fontName: 'bahnschrift48s',fontSize: 20})
		this.tScore.tint=0xB4E5A2
		
		this.cards=[]
		
		if (params.anchorDown){
			this.tName.anchor.set(0.5,0.5)
			this.tName.x=0
			this.tName.y=params.w-10
			
			this.tRating.anchor.set(0.5,0.5)
			this.tRating.x=0
			this.tRating.y=params.w+10
			
			this.tScore.anchor.set(0.5,0.5)
			this.tScore.x=0
			this.tScore.y=params.w+30
		}
		
		if (params.anchorRight){
			this.tName.anchor.set(0,0.5)
			this.tName.x=params.w-10
			this.tName.y=-20
			
			this.tRating.anchor.set(0,0.5)
			this.tRating.x=params.w-10
			this.tRating.y=0
			
			this.tScore.anchor.set(0,0.5)
			this.tScore.x=params.w-10
			this.tScore.y=20
		}
							
		this.score=0		
		this.uid=0
		this.lastPlayed=0
		this.ai=0
		
		this.addChild(this.photoBcg,this.photo,this.photoFrame, this.tName,this.tRating,this.tScore)
	}
	
	setCardsOpen(isOpen){
		
		this.cards.forEach(c=>c.setOpen(isOpen))
		
	}
	
	organizeCards(openMyCards){
		
		//сортируем и распределяем
		this.cards.sort((a,b)=>a.sortVal-b.sortVal);
		this.cards.forEach((cardSpr,i)=>{
			cardSpr.zIndex=i
		})		
		
		
		if (this.index===0){	

			const safeWidth=600			
			const visCards=this.cards.filter(c=>!c.finished)
			
			//общая длина карт без пересечений и оверлапов
			const totalWidth=visCards.length*90
			
			//нормальная длина с оверлапом 10
			let normalWidth=totalWidth-(visCards.length-1)*10
			
			if (normalWidth>safeWidth) normalWidth=safeWidth
			
			const overlap=visCards.length>1?(totalWidth-normalWidth)/(visCards.length-1):0
			
			const startX=(800-normalWidth)*0.5+90*0.5
			const stepX=90-overlap
			
			visCards.forEach((c,i)=> {
				const tar_x = startX+i*stepX
				anim3.add(c,{
					x:[c.x, tar_x,'easeInOutCubic'],
					y:[c.y, 410,'easeInOutCubic'],
					angle:[c.angle,0,'linear']
				}, true, 0.7);
			})
			
			this.setCardsOpen(openMyCards)
		}
		
		if (this.index===1){
			
				
			const visCards=this.cards.filter(c=>!c.finished)
			
			const safeHeight=90+(visCards.length-1)*20		
			
			const totalHeight=visCards.length*90
			
			let normalHeight=totalHeight-(visCards.length-1)*10
			if (normalHeight>safeHeight) normalHeight=safeHeight
			
			const overlap=visCards.length>1?(totalHeight-normalHeight)/(visCards.length-1):0
			
			const startY=(450-normalHeight)*0.5+90*0.5
			const stepY=90-overlap
			
			visCards.forEach((c,i)=> {
				const tar_y = startY+i*stepY
				anim3.add(c,{
					y:[c.y, tar_y,'easeInOutCubic'],
					x:[c.x, 0,'easeInOutCubic'],
					angle:[c.angle,90,'linear']
				}, true, 0.25);
			})
			this.setCardsOpen(0)
		}
		
		if (this.index===2){
		
			const visCards=this.cards.filter(c=>!c.finished)			
			const safeWidth=90+(visCards.length-1)*20	
			
			const totalWidth=visCards.length*90
			
			let normalWidth=totalWidth-(visCards.length-1)*10
			if (normalWidth>safeWidth) normalWidth=safeWidth
			
			const overlap=visCards.length>1?(totalWidth-normalWidth)/(visCards.length-1):0
			
			const startX=(800-normalWidth)*0.5+90*0.5
			const stepX=90-overlap
			
			visCards.forEach((c,i)=> {
				const tar_x = startX+i*stepX
				anim3.add(c,{
					x:[c.x, tar_x,'easeInOutCubic'],
					y:[c.y, 0,'easeInOutCubic'],
					angle:[c.angle,-180,'linear']					
				}, true, 0.25);
			})
			this.setCardsOpen(0)
		}

		if (this.index===3){
					
			const visCards=this.cards.filter(c=>!c.finished)
			
			const safeHeight=90+(visCards.length-1)*20	
			
			const totalHeight=visCards.length*90
			
			let normalHeight=totalHeight-(visCards.length-1)*10
			if (normalHeight>safeHeight) normalHeight=safeHeight
			
			const overlap=visCards.length>1?(totalHeight-normalHeight)/(visCards.length-1):0
			
			const startY=(450-normalHeight)*0.5+90*0.5
			const stepY=90-overlap
			
			visCards.forEach((c,i)=> {
				const tar_y = startY+i*stepY
				anim3.add(c,{
					x:[c.x, 800,'easeInOutCubic'],
					y:[c.y, tar_y,'easeInOutCubic'],
					angle:[c.angle,-90,'linear']
				}, true, 0.25);
			})
			this.setCardsOpen(0)
		}
		
	}
	
}

class tableIconClass extends PIXI.Container{

	constructor(id){

		super();

		const tableId=id;
		this.tableId=tableId


		this.tableIcon=new PIXI.Sprite(assets.table_icon);
		this.tableIcon.y=3;
		this.tableIcon.width=192.5;
		this.tableIcon.height=110;
		this.tableIcon.interactive=true;
		this.tableIcon.buttonMode=true;
		this.tableIcon.pointerdown=function(){tablesMenu.tableDown(tableId)};

		this.tableTitle=new PIXI.BitmapText('СТОЛ №1', {fontName: 'bahnschrift48', fontSize :26});
		this.tableTitle.x=96;
		this.tableTitle.y=0;
		this.tableTitle.tint=0xffff00;
		this.tableTitle.text=['СТОЛ №','ROOM №'][LANG]+id;
		this.tableTitle.anchor.set(0.5,0.5);

		this.numOfPlayersText=new PIXI.BitmapText('', {fontName: 'bahnschrift48', fontSize :22});
		this.numOfPlayersText.x=96;
		this.numOfPlayersText.y=84;
		this.numOfPlayersText.anchor.set(0.5,0.5);
		this.numOfPlayersText.tint=0xD6DCE5;


		this.addChild(this.tableIcon,this.tableTitle,this.numOfPlayersText);
	}

}

fbs_once=async function(path){
	const info=await fbs.ref(path).get();
	return info.val();
}

anim3={

	c1: 1.70158,
	c2: 1.70158 * 1.525,
	c3: 1.70158 + 1,
	c4: (2 * Math.PI) / 3,
	c5: (2 * Math.PI) / 4.5,
	empty_spr : {x:0,visible:false,ready:true, alpha:0},

	slots: new Array(100).fill().map(u => ({obj:{},on:0,block:true,params_num:0,p_resolve:0,progress:0,vis_on_end:false,tm:0,params:new Array(10).fill().map(u => ({param:'x',s:0,f:0,d:0,func:this.linear}))})),

	any_on() {

		for (let s of this.slots)
			if (s.on&&s.block)
				return true
		return false;
	},

	wait(seconds){
		return this.add(this.empty_spr,{x:[0,1,'linear']}, false, seconds);
	},

	linear(x) {
		return x
	},

	kill_anim(obj) {

		for (let i=0;i<this.slots.length;i++){
			const slot=this.slots[i];
			if (slot.on&&slot.obj===obj){
				this.finish_slot(slot)
				slot.p_resolve(2)
			}
		}
	},
	
	finish_all_slots(){		
		for (let i=0;i<this.slots.length;i++){
			const slot=this.slots[i];
			if (slot.on){
				this.finish_slot(slot)
				slot.p_resolve(3)
			}
		}
	},

	easeBridge(x){

		if(x<0.1)
			return x*10;
		if(x>0.9)
			return (1-x)*10;
		return 1
	},

	easeOutBack(x) {
		return 1 + this.c3 * Math.pow(x - 1, 3) + this.c1 * Math.pow(x - 1, 2);
	},

	easeOutElastic(x) {
		return x === 0
			? 0
			: x === 1
			? 1
			: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * this.c4) + 1;
	},

	easeOutSine(x) {
		return Math.sin( x * Math.PI * 0.5);
	},

	easeOutQuart(x){
		return 1 - Math.pow(1 - x, 4);
	},

	easeOutCubic(x) {
		return 1 - Math.pow(1 - x, 3);
	},

	easeTwiceBlink(x){

		if(x<0.333)
			return 1;
		if(x>0.666)
			return 1;
		return 0
	},

	flick(x){

		return Math.abs(Math.sin(x*6.5*3.141593));

	},

	easeInBack(x) {
		return this.c3 * x * x * x - this.c1 * x * x;
	},

	easeInQuad(x) {
		return x * x;
	},

	easeOutBounce(x) {
		const n1 = 7.5625;
		const d1 = 2.75;

		if (x < 1 / d1) {
			return n1 * x * x;
		} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	},

	easeInCubic(x) {
		return x * x * x;
	},

	ease3peaks(x){

		if (x < 0.16666) {
			return x / 0.16666;
		} else if (x < 0.33326) {
			return 1-(x - 0.16666) / 0.16666;
		} else if (x < 0.49986) {
			return (x - 0.3326) / 0.16666;
		} else if (x < 0.66646) {
			return 1-(x - 0.49986) / 0.16666;
		} else if (x < 0.83306) {
			return (x - 0.6649) / 0.16666;
		} else if (x >= 0.83306) {
			return 1-(x - 0.83306) / 0.16666;
		}
	},

	ease2back(x) {
		return Math.sin(x*Math.PI);
	},

	easeInOutCubic(x) {

		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	},

	easeInOutBack(x) {

		return x < 0.5
		  ? (Math.pow(2 * x, 2) * ((this.c2 + 1) * 2 * x - this.c2)) / 2
		  : (Math.pow(2 * x - 2, 2) * ((this.c2 + 1) * (x * 2 - 2) + this.c2) + 2) / 2;
	},

	shake(x) {

		return Math.sin(x*2 * Math.PI);


	},

	add (obj, inp_params, vis_on_end, time, block) {

		//если уже идет анимация данного спрайта то отменяем ее
		anim3.kill_anim(obj)
		
		if(document.hidden){
			this.finish_obj(obj,inp_params,vis_on_end)
			return
		}
		

		let found=false;
		//ищем свободный слот для анимации
		for (let i = 0; i < this.slots.length; i++) {

			const slot=this.slots[i];
			if (slot.on) continue;

			found=true;

			obj.visible = true
			obj.ready = false

			//заносим базовые параметры слота
			slot.on=1;
			slot.params_num=Object.keys(inp_params).length;
			slot.obj=obj;
			slot.vis_on_end=vis_on_end;
			slot.block=block===undefined;
			slot.t1=TM.s
			slot.t=time

			//добавляем дельту к параметрам и устанавливаем начальное положение
			let ind=0;
			for (const param in inp_params) {

				const s=inp_params[param][0];
				let f=inp_params[param][1];
				const d=f-s;


				//для возвратных функцие конечное значение равно начальному что в конце правильные значения присвоить
				const func_name=inp_params[param][2];
				const func=anim3[func_name].bind(anim3);
				if (func_name === 'ease2back'||func_name==='shake') f=s;

				slot.params[ind].param=param;
				slot.params[ind].s=s;
				slot.params[ind].f=f;
				slot.params[ind].d=d;
				slot.params[ind].func=func;
				ind++;

				//фиксируем начальное значение параметра
				obj[param]=s;
			}

			return new Promise(resolve=>{
				slot.p_resolve = resolve;
			});
		}

		console.log("Кончились слоты анимации");
		this.finish_obj(obj,inp_params,vis_on_end)



	},
	
	finish_obj(obj,params,vis_on_end){
		
		//сразу записываем конечные параметры объекта
		for (const param in params)
			obj[param]=params[param][1]
		obj.ready=true		
		obj.visible=vis_on_end		
		if(!vis_on_end) obj.alpha=1	
	},
	
	finish_slot(slot){
		
		//заносим конечные параметры
		for (let i=0;i<slot.params_num;i++){
			const param=slot.params[i].param;
			const f=slot.params[i].f;
			slot.obj[param]=f;
		}
		
		slot.on = 0
		slot.obj.ready=true
		slot.obj.visible=slot.vis_on_end;
		if(!slot.vis_on_end) slot.obj.alpha=1;
	},

	process () {

		for (let i = 0; i < this.slots.length; i++) {
			const slot=this.slots[i];
			const obj=slot.obj;
			if (slot.on) {

				const progress=(TM.s-slot.t1)/slot.t

				for (let i=0;i<slot.params_num;i++){

					const param_data=slot.params[i]
					const param=param_data.param
					const s=param_data.s
					const d=param_data.d
					const func=param_data.func
					slot.obj[param]=s+d*func(progress)
				}

				//если анимация завершилась то удаляем слот
				if (progress>=0.999) {
					this.finish_slot(slot)
					slot.p_resolve(1)
				}
			}
		}
	}
}

sound={

	on : 1,

	play(res_name, res_src) {

		res_src=res_src||assets;

		if (!this.on||document.hidden)
			return;

		if (!res_src[res_name])
			return;

		res_src[res_name].play();

	},

	switch(){

		if (this.on){
			this.on=0;
			objects.pref_info.text=['Звуки отключены','Sounds is off'][LANG];

		} else{
			this.on=1;
			objects.pref_info.text=['Звуки включены','Sounds is on'][LANG];
		}
		anim3.add(objects.pref_info, {alpha: [0, 1, 'easeBridge']}, false, 3, false);

	}

}

pmsg={

	promise_resolve :0,

	async add({t='text', timeout=3000,snd='message',online=0}={}) {

		if (this.promise_resolve!==0)
			this.promise_resolve("forced")
			
		//воспроизводим звук
		sound.play(snd);

		objects.pmsg_text.text=t
		const anim_res=await anim3.add(objects.pmsg_cont,{x:[-200,objects.pmsg_cont.sx,'easeOutBack']}, true, 0.25);

		if (anim_res===2) return
		
		const res = await new Promise(res => {
			pmsg.promise_resolve = res;
			setTimeout(res, timeout)
		})

		if (res==="forced") return

		anim3.add(objects.pmsg_cont,{x:[objects.pmsg_cont.sx, -200,'easeInBack']}, false, 0.25);
	},
	
	no_in_chat_down(){
		pmsg.promise_resolve()
		mp_game.no_in_chat_cmd()
	},

	clicked() {
		pmsg.promise_resolve()
	}

}

hintMsg={
	
	closeTimer:0,
	
	send({t= 'xxx',timeout=3000} = {}){
		clearTimeout(this.closeTimer)
		objects.hintMsgText.text=t		
		objects.hintMsgBcg.width=objects.hintMsgText.width+50
		objects.hintMsgBcg.height=objects.hintMsgText.height+40
		objects.hintMsgBcg.x=-objects.hintMsgBcg.width*0.5
		objects.hintMsgBcg.y=-objects.hintMsgBcg.height*0.5
		anim3.add(objects.hintMsgCont, {alpha: [0,1,'linear']}, true, 0.25)
		this.closeTimer=setTimeout(()=>{
			this.close()
		},timeout)
	},
	
	close(){
		
		anim3.add(objects.hintMsgCont, {alpha: [1,0,'linear']}, false, 0.25)
		clearTimeout(this.closeTimer)
	}
	
}

game = {

	opponent : '',
	selected_checker : 0,
	state : 'off',
	move_processor:0,
	trnm:0,
	all_cards:[],
	exch_token:0,
	passingCardsNum:0,
	myPlayerIndex:0,
	heartBroken:0,
	leadingSuit:0,
	myPcard:0,
	tableCards:[],
	trickLeaderPcard:0,
	nextPlayerIndex:0,
	tableId:0,
	tableStr:'',
	PLAYER_INDEX_TO_PCARD:[0,0,0,0],
	
	async activate(params={}) {

		for (const cardSpr of objects.allCards){
			cardSpr.visible=false
			cardSpr.x=randIntInc(350,450)
			cardSpr.y=randIntInc(200,300)
		}
		
		this.tableId=params.tableId
		this.tableStr='table'+this.tableId
		
		objects.gameCont.visible=true
		
		//записываем свое время регистрации
		fbs.ref(this.tableStr+'/players/'+my_data.uid).set(firebase.database.ServerValue.TIMESTAMP)
		
		await this.analyseTable()
				
		this.myPcard=0				
		this.myPlayerIndex=-1		
		
		//сначала просто распределяем ссылки
		for (let p=0;p<NUM_OF_PLAYERS;p++){	
		
			const pcard=objects.pCards[p]
			this.PLAYER_INDEX_TO_PCARD[p]=pcard
			
			for (let c=0;c<HAND_SIZE;c++){
				const cardData=cards_lib[p*13+c]
				const cardSpr=objects.allCards[p*13+c]
				cardSpr.playerIndex=p
				cardSpr.setCard(cardData)
				pcard.cards.push(cardSpr)				
			}
			
			pcard.organizeCards(0)			
		}	
		
		let skip_first=1
		fbs.ref(this.tableStr+'/from_server').on('value',v=>{
			if(skip_first){skip_first=0;return}
			this.eventsFromServer(v.val())
		})

	},
	
	async analyseTable(){
		
		const state=await fbs_once(this.tableStr+'/state')||{}
		if (state.passing || state.playing){
			const admPlayers=await fbs_once(this.tableStr+'/admPlayers')
			for (let p=0;p<NUM_OF_PLAYERS;p++){			
				const pcard=objects.pCards[p]
				pcard.tName.text=admPlayers[p]
			}
		}
	},
	
	createSeededShuffledArray(N, seed) {
		// Create array from 0 to N-1
		const array = Array.from({ length: N }, (_, i) => i);
		
		// Simple hash function to convert seed string to a number
		function hashString(str) {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				const char = str.charCodeAt(i);
				hash = ((hash << 5) - hash) + char;
				hash = hash & hash; // Convert to 32-bit integer
			}
			return Math.abs(hash);
		}
		
		// Seeded pseudo-random number generator (using mulberry32 algorithm)
		function mulberry32(a) {
			return function() {
				a |= 0; a = a + 0x6D2B79F5 | 0;
				let t = Math.imul(a ^ a >>> 15, 1 | a);
				t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
				return ((t ^ t >>> 14) >>> 0) / 4294967296;
			};
		}
		
		// Create seeded random number generator
		const seedNumber = hashString(seed);
		const random = mulberry32(seedNumber);
		
		// Fisher-Yates shuffle with seeded random
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		
		return array;
	},

	eventsFromServer(data){
		console.log('eventsFromServer',data)
		
		//начало игры (и запрос на обмен)
		if (data.e===EVENTS.INIT_GAME){
			this.processGameInit(data)
		}				
		
		//обмен закончен - передаем карты
		if (data.e===EVENTS.PASSING_FIN){
			this.passingFinEvent(data)
		}			

		//уведомление что взятка закончена(4 карты сыграны)
		if (data.e===EVENTS.TRICK_FIN){
			this.process_trick_fin(data)
		}
		
		//уведомление что взятка закончена(4 карты сыграны)
		if (data.e===EVENTS.TRICK_START){
			this.processTrickStart(data)
		}

		//ход от игрока (1 карта)
		if (data.e===EVENTS.MOVE_FROM_PLAYER){
			this.processMove(data)
		}	

	},
	
	cache_updated(uid,player){		
		for (const pcard of objects.pCards){			
			if (pcard.uid===uid){
				pcard.tName.text=player.name
				pcard.tRating.text=player.rating
				pcard.rating=player.rating				
				pcard.photo.set_texture(player.texture)				
			}
		}		
	},
	
	processGameInit(data){
	
		const cardsRefs=this.createSeededShuffledArray(52,data.seed)
					
		objects.resDlgCont.visible=false
					
		//токен обмена это сид
		this.passingToken=data.seed
		
		this.passingCardsNum=0
		this.heartBroken=0
		this.tableCards=[]		
		this.trickLeaderPcard=0

		this.passingCardsNum=0
		objects.allCards.forEach(c=>{
			c.passingCard=0
			c.finished=0
			c.tarPCardIndex=undefined
		})		
		
		//индексы игроков и здесь мой индекс на первое место ставим
		//myPlayerIndex - это индекс моего игрока который пришел с сервера, но относится к нулевой карточке
		const playersIndexesMyFirst=[0,1,2,3]
		this.myPlayerIndex=data.uids.findIndex(u=>u===my_data.uid)??-1
		if (this.myPlayerIndex>=0){
			const [item]=playersIndexesMyFirst.splice(this.myPlayerIndex, 1)
			playersIndexesMyFirst.unshift(item)
			this.myPcard=objects.pCards[0]
			hintMsg.send({t:'Выберите 3 карты для передачи',timeout:15000})
		}			
		
		//загружаем данные и отображаем карточки игроков
		for (let p=0;p<NUM_OF_PLAYERS;p++){
			
			const pcard=objects.pCards[p]
			const playerIndex=playersIndexesMyFirst[p]
			const playerUID=data.uids[playerIndex]
			this.PLAYER_INDEX_TO_PCARD[playerIndex]=pcard

			pcard.uid=playerUID
			pcard.playerIndex=playerIndex
			pcard.tName.text=''
			//pcard.rating=randIntInc(1300,1600)
			//pcard.tRating.text=pcard.rating
			pcard.score=0
			pcard.tScore.text=0
			pcard.cards=[]
			pcard.ai=+playerUID.includes('aiPlayer')
			if (pcard.ai){
				pcard.tName.text='ai_'+p
				pcard.photo.set_texture(assets.aiAvatarImg)
			} else
				players_cache.update(playerUID)
									
			//заполняем картами
			for (let c=0;c<HAND_SIZE;c++){				
				const cardData=cards_lib[cardsRefs[playerIndex*13+c]]
				const cardSpr=objects.allCards[playerIndex*13+c]
				
				cardSpr.playerIndex=playerIndex
				cardSpr.setCard(cardData)
				pcard.cards.push(cardSpr)				
			}		

			//мои карты открываем
			pcard.organizeCards(playerIndex===this.myPlayerIndex)			
			
		}		
		
		
		timer.start(this.myPcard)
		
		objects.allCardsCont.sortChildren()	

		this.state='passing'
		
	},

	ratingChange(r0, r1, s0, s1) {
		
		const K = 32;

		// Lower Hearts score wins
		const actual = s0 < s1 ? 1 : s0 > s1 ? 0 : 0.5;

		// Standard Elo expected result
		const expected =
		1 / (1 + Math.pow(10, (r1 - r0) / 400));

		// Score margin: 0 = tie, 1 = maximum possible difference
		const margin = Math.abs(s0 - s1) / 26;

		// Margin multiplier.
		// A close win gets normal K.
		// A dominant win gets up to 2x K.
		const multiplier = 1 + margin;

		return Math.round(
		K * multiplier * (actual - expected)
		)
		
	},
	
	async passingFinEvent(data){		
		
		
		hintMsg.close()
		
		//убираем карты которые игроки выбрали для обмена
		
		//вычисляем по какой схеме будет отмен
		const passingSchemeIndex=this.createSeededShuffledArray(4,this.passingToken)[0]
		const passingSchemes=[
			[[0,1],[1,2],[2,3],[3,0]],
			[[0,2],[1,3],[2,0],[3,1]],
			[[0,1],[1,2],[2,3],[3,0]],
			[[0,1],[1,2],[2,3],[3,0]],
		]
		const passingScheme=passingSchemes[0]
					
		//карты которые отдаются
		this.PLAYER_INDEX_TO_PCARD[0].passingCards=data.cards[0]
		this.PLAYER_INDEX_TO_PCARD[1].passingCards=data.cards[1]
		this.PLAYER_INDEX_TO_PCARD[2].passingCards=data.cards[2]
		this.PLAYER_INDEX_TO_PCARD[3].passingCards=data.cards[3]
						
		//старые z индексы
		for (const pcard of objects.pCards)
			for (const card of pcard.cards)
				card.oldZ=card.zIndex
							
		//полет карт от игроков
		for (let i=0;i<4;i++){
			
			const curPcard=this.PLAYER_INDEX_TO_PCARD[i]
			const tarPlayerIndex=passingScheme[i][1]
			const tarPcard=this.PLAYER_INDEX_TO_PCARD[tarPlayerIndex]
			const tarPCardIndex=tarPcard.index
			
			for (let c=0;c<3;c++){
				
				const curCardIndex=curPcard.passingCards[c]
				const curCardSpr=curPcard.cards.find(c=>c.cardData.index===curCardIndex)
				curCardSpr.tarPCardIndex=tarPCardIndex
				
				const tarCardIndex=tarPcard.passingCards[c]
				const tarCardSpr=tarPcard.cards.find(c=>c.cardData.index===tarCardIndex)
				
				curCardSpr.zIndex=tarCardSpr.oldZ				
				
				anim3.add(curCardSpr,{
					x:[curCardSpr.x, tarCardSpr.x,'linear'],
					y:[curCardSpr.y, tarCardSpr.y,'linear'],
					angle:[curCardSpr.angle, tarCardSpr.angle,'linear']
				}, true, 0.5).then(()=>{
						curCardSpr.setOpen(tarPCardIndex===0)
				
				})
			}			
		}
				
		//добавляем присланные карты
		for (const pcard of objects.pCards) {
			for (let i = pcard.cards.length - 1; i >= 0; i--) {
				const card = pcard.cards[i];
				const tarPCardIndex = card.tarPCardIndex;
				if (tarPCardIndex!==undefined&&tarPCardIndex!==pcard.index) {
					objects.pCards[tarPCardIndex].cards.push(card);
				}
			}
		}		
		
		//убираем ушедшие карты
		for (const pcard of objects.pCards){			
			for (let i=pcard.cards.length-1;i>=0;i--){
				const card=pcard.cards[i]
				const tarPCardIndex=card.tarPCardIndex
				if (tarPCardIndex!==undefined&&tarPCardIndex!==pcard.index)
					pcard.cards.splice(i, 1)				
			}				
		}
		objects.allCardsCont.sortChildren();
		
		
		//обновляем индексы игроков так как они остались от присланных и ушедших карт
		for (const pcard of objects.pCards)
			for (const card of pcard.cards)
				card.playerIndex=pcard.playerIndex

		
		//return
		await anim3.wait(0.6)
		
		objects.pCards[0].organizeCards(this.myPlayerIndex!==-1)
		objects.pCards[1].organizeCards(0)
		objects.pCards[2].organizeCards(0)
		objects.pCards[3].organizeCards(0)
		
		//показываем присланные карты
		this.myPcard.cards.forEach(c=>{if(c.tarPCardIndex!=null)c.recFlagIcon.visible=true})
		
		objects.allCardsCont.sortChildren();
		
		//проверяем появление ии после выбора карта
		data.ai.forEach((ai,i)=>{
			objects.pCards[i].ai=ai
		})
			
		//показываем кто ходит
		this.hlNextPlayerCard(data.nextPlayerIndex)
	
	},
	
	hlNextPlayerCard(playerIndex){

		if (this.myPlayerIndex===playerIndex) this.state='move'		
		const pCard=this.PLAYER_INDEX_TO_PCARD[playerIndex]
		timer.start(pCard)

	},
	
	getLosePcard(){
				
		let losePcard=this.trickLeaderPcard
		
		for (const pcard of objects.pCards){
			
			const pSuit=pcard.lastPlayed.suit
			const pVal=pcard.lastPlayed.val			
			if (pSuit===losePcard.lastPlayed.suit&&pVal>losePcard.lastPlayed.val)				
				losePcard=pcard				
		}
		
		return losePcard
	},
	
	getCardsScore(cards){
		
		let sum=0
		for (const cardData of cards){			
			if (cardData.suit==='h') sum++
			if (cardData.index===QUEEN_OF_SPADES_INDEX) sum+=13
		}		
		return sum
		
	},
			
	exitBtnDown(){
		
		this.close()
		tablesMenu.activate()
		
	},
			
	processMove(data){												
					
		console.log(cards_lib[data.cardIndex])
		
		//определяем карточку от которой пришел ход
		const pCard=this.PLAYER_INDEX_TO_PCARD[data.pIndex]

		if(data.ai) {
			console.log('игрок стал ИИ')
			pCard.photo.set_texture(assets.aiAvatarImg)
			pCard.ai=1
		}

		//запоминаем сыгранную карту
		const cardData=cards_lib[data.cardIndex]
		pCard.lastPlayed=cardData
	
		let isLeadingCard=0
		if (!this.trickLeaderPcard){
			this.trickLeaderPcard=pCard
			isLeadingCard=1
		} 		
		
		//проверяем разбиты ли червы
		if (!this.heartBroken&&cards_lib[data.cardIndex].suit==='h'){
			this.heartBroken=1			
		} 
							
		//если это от меня то не перемещаем - это уже сделано
		if (pCard.ai||(data.pIndex!==this.myPlayerIndex))
			this.sendCardFromPcardToCenter(pCard,data.cardIndex,isLeadingCard)								

		//подсвечиваем следующего игрока	
		if (data.nextPlayerIndex>=0)		
			this.hlNextPlayerCard(data.nextPlayerIndex)			
		else
			this.processTrickFin(data.trickFin)
		
	},
	
	sendCardFromPcardToCenter(pCard,cardIndex,isLeadingCard){
	
		//целевая карта на столе
		const tarPosData=objects.tableCardsPos[pCard.index]
		let cardSpr=pCard.cards.find(c=>c.cardData.index===cardIndex)
		if(!cardSpr){
			//если не нашли то тупо берем первую
			cardSpr=pCard.cards[0]
			cardSpr.setCard(cardIndex)
			console.log('не нашли такую карту!!!')
		}

		
		this.tableCards.push(cardSpr)
		
		cardSpr.zIndex=this.tableCards.length
		objects.allCardsCont.sortChildren()
		
		// убираем карту из колоды игрока
		const cardIndexToRemoveIndex=pCard.cards.findIndex(c=>c.cardData.index===cardIndex)
		pCard.cards.splice(cardIndexToRemoveIndex, 1)

		cardSpr.setOpen(1)

		//анимационно вылетает
		anim3.add(cardSpr,{
			x:[cardSpr.x,tarPosData.x, 'linear'],
			y:[cardSpr.y,tarPosData.y, 'linear'],
			angle:[cardSpr.angle,0,'linear']
		}, true, 0.25)
		
		
	},
	
	async sendMyCardToCenter(cardObj,isLeadingCard){
	
		this.state='waiting'
	
		//целевая карта на столе
		const tarPosData=objects.tableCardsPos[0]		
		
		this.tableCards.push(cardObj)
		
		cardObj.zIndex=this.tableCards.length
		objects.allCardsCont.sortChildren()
		
		// убираем карту из колоды игрока
		const cardIndex=this.myPcard.cards.findIndex(c=>c.cardData.index===cardObj.cardData.index)
		this.myPcard.cards.splice(cardIndex, 1)
		
		//анимационно вылетает
		await anim3.add(cardObj,{
			x:[cardObj.x,tarPosData.x, 'linear'],
			y:[cardObj.y,tarPosData.y, 'linear'],
		}, true, 0.15)
		
	},
	
	async processTrickFin(trickFin){
								
		timer.stop()
		
		await new Promise(r=>setTimeout(r,1000))
				
		//определяем кто проиграл трик
		const losePcard=this.getLosePcard()
		const allPlayedCards=objects.pCards.map(p=>p.lastPlayed)
		const score=this.getCardsScore(allPlayedCards)
		
		losePcard.score+=score
		losePcard.tScore.text=losePcard.score

		//Вычисляем кто програл взятку и отправляем ему все карты
		for (const card_spr of this.tableCards){
			
			card_spr.finished=1
			anim3.add(card_spr, {
				x:[card_spr.x,losePcard.x, 'linear'],
				y:[card_spr.y,losePcard.y, 'linear'],
				alpha:[1,0, 'linear'],
			}, false, 0.25)
		
		}			
		
		this.state='trickFin'
		
		console.log('Забрал все: ',losePcard.index)

		this.trickLeaderPcard=0
		this.tableCards=[]

		//если это просмотр и количество карт не соответствует
		if (trickFin!==undefined){
			const cardsLeftPerPlayer=12-trickFin
			objects.pCards.forEach(pcard=>{				
				if (pcard.cards.length!==cardsLeftPerPlayer){
					pcard.cards.forEach(c=>c.visible=false)
					pcard.cards.length=cardsLeftPerPlayer
					pcard.cards.forEach(c=>c.visible=true)
				}
			})
		}
		
		objects.pCards[0].organizeCards(this.myPlayerIndex!==-1)
		objects.pCards[1].organizeCards(0)
		objects.pCards[2].organizeCards(0)
		objects.pCards[3].organizeCards(0)

		//проверяем конец игры
		if (!objects.pCards[0].cards.length){
			
			//если есть игрок набравший 26  очков
			const playerWith26=objects.pCards.find(c=>{c.score===26})
			if (playerWith26){
				playerWith26.score=0
				objects.pCards.forEach(p=>{
					if (p!==playerWith26) p.score=26
				})
				
			}

			const nonAiPlayer=objects.pCards.filter(p=>{return !p.ai})
			if (nonAiPlayer.length>1){
				for (const p0 of nonAiPlayer){
					p0.ratingChange=0
					for (const p1 of nonAiPlayer){
						if (p0!==p1){
							const ratingChange=this.ratingChange(p0.rating,p1.rating,p0.score,p1.score)
							p0.ratingChange+=ratingChange
						}
					}
				}
			}

			for (let i=0;i<4;i++){
				const player=objects.pCards[i]
				objects.resDlgNames[i].text=player.tName.text
				objects.resDlgScores[i].text=player.score
				objects.resDlgRatings[i].text=player.ratingChange
			}

			objects.resDlgCont.visible=true
			
			console.log('игра закончена!!!')
			fbs.ref(this.tableStr+'/players/'+my_data.uid).set(firebase.database.ServerValue.TIMESTAMP)
		}
		
	},
	
	processTrickStart(data){
					
		//подсвечиваем следующего игрока	
		if (data.nextPlayerIndex>=0){
			if (this.myPlayerIndex===data.nextPlayerIndex) this.state='move'
			this.hlNextPlayerCard(data.nextPlayerIndex)
		}

	},
		
	sendPassingCards(){
		
		const cardsForPassing=this.myPcard.cards.filter(c=>c.passingCard).map(c=>c.cardData.index)
		if(cardsForPassing.length!==3) {
			hintMsg.send({t:'Выберите 3 карты для передачи сопернику'})
			return
		}
				
		hintMsg.send({t:'Ждите остальных игроков',timeout:15000})
		fbs.ref(this.tableStr+'/from_players').set({e:EVENTS.PASSING_FIN,cards:cardsForPassing,token:this.passingToken,uid:my_data.uid})
		
		objects.send_exch_cards_btn.visible=false
		
		this.state='waiting'
		
	},
	
	cardDown(cardObj){
		
		if (this.myPcard.ai){			
			hintMsg.send({t:'За вашим местом играет ИИ. Ждите следующую партию)))'})
			return
		}
		
		if (this.myPlayerIndex===-1){
			hintMsg.send({t:'Вы не участвуете в игре)))'})
			return
		}
		
		if (this.myPlayerIndex!==cardObj.playerIndex){
			hintMsg.send({t:'Это не ваша карта)))'})
			return
		}
		
		if(this.state==='waiting'){
			hintMsg.send({t:'Не ваша очередь)))'})
			return
		}
		
		if(this.state==='trickFin'){
			hintMsg.send({t:'Подождите...'})
			return
		}
				
		if(this.state==='passing'){
			
			if (cardObj.passingCard){				
				anim3.add(cardObj, {y: [cardObj.y, cardObj.y+15, 'linear']}, true, 0.1)
				cardObj.passingCard=0	
				this.passingCardsNum--
			}else{
				if (this.passingCardsNum===3) return
				anim3.add(cardObj, {y: [cardObj.y, cardObj.y-15, 'linear']}, true, 0.1)
				cardObj.passingCard=1	
				this.passingCardsNum++
			}			
			
			//отображаем кнопку если выбрано 3 карты
			if (this.passingCardsNum===3){
				objects.send_exch_cards_btn.visible=true			
				hintMsg.close()
			}else{
				objects.send_exch_cards_btn.visible=false			
				hintMsg.send({t:'Выберите 3 карты для передачи',timeout:15000})
			}

			
		}		
		
		if(this.state==='move'){
					
			//провряем можно ли ходить
			const cardData=cardObj.cardData
			const no_hearts_cards=this.myPcard.cards.find(c=>{return c.visible&&(c.cardData.suit!=='h')})
			const have_2C=this.myPcard.cards.find(c=>{return c.visible&&c.cardData.index===TWO_OF_CUBES_INDEX})
			const leadingSuit=this.trickLeaderPcard?this.trickLeaderPcard.lastPlayed.suit:0			
			const haveLeadSuit=this.myPcard.cards.find(c=>{return c.visible&&c.cardData.suit===leadingSuit})
			
			if (cardData.suit==='h'&&!this.heartBroken&&!leadingSuit&&no_hearts_cards){
				hintMsg.send({t:'Червы еще не разбиты! Выберите другую карту.'})
				return
			}
			
			if (have_2C&&cardData.index!==TWO_OF_CUBES_INDEX){
				hintMsg.send({t:'Первый ход нужно начинать с двойки треф!'})
				return
			}
			
			if (haveLeadSuit&&cardData.suit!==leadingSuit){
				hintMsg.send({t:'Нужно той же мастью как ходил первый игрок ('+rusSuits[leadingSuit]+')!'})
				return	
			}
									
			this.state='waiting'		
			const move_data={e:EVENTS.MOVE_FROM_PLAYER,cardIndex:cardData.index,uid:my_data.uid,tm:Date.now()}
			fbs.ref(this.tableStr+'/from_players').set(move_data)	
			this.sendMyCardToCenter(cardObj,leadingSuit===0)
	
		}				
	}
}

tablesMenu={
	
	activate(){
		
		objects.tablesCont.visible=true
		
	},
	
	tableDown(tableId){
		
		this.close()
		game.activate({tableId})
		
	},
	
	close(){
		
		objects.tablesCont.visible=false
		
		
	}
	
}

timer={
	
	t:0,
	secLeft:0,
		
	start(pCard){

		clearInterval(this.t)
		this.t=setInterval(()=>this.tick(),1000)
		this.secLeft=15
		this.updateText()
		
		if (!objects.timerCont.visible){
			objects.timerCont.x=400
			objects.timerCont.y=225			
		}
		
		objects.timerCont.angle=0
		objects.timerCont.alpha=1
		anim3.add(objects.timerCont, {
			x: [objects.timerCont.x, pCard.timerPlace_x, 'linear'],
			y: [objects.timerCont.y, pCard.timerPlace_y, 'linear'],
		}, true, 0.25);	

	},
	
	tick(){

		this.secLeft--
		this.updateText()

	},
	
	stop(){
		
		clearInterval(this.t)
		objects.timerCont.visible=false		
		anim3.add(objects.timerCont, {
			alpha: [1,0, 'linear'],
			angle: [0,360, 'linear'],
		}, false, 0.25);
	},
	
	updateText(){
		
		if (this.secLeft<0) return
		objects.timerText.text=(this.secLeft>9?'0:':'0:0')+Math.abs(this.secLeft)

	},
	
}

players_cache={

	on:0,
	loading:{},

	async update(uid,params={}){

		//ссылка на игрока
		this[uid]||={}
		const player=this[uid]

		if (this.loading[uid]) return


		while(Object.keys(this.loading).length>6){
			console.log('Много загрузок, ждем...')
			await new Promise(r => setTimeout(r, hf.randIntInc(400,800)));
		}

		this.loading[uid]=1

		//загружаем имя если нет данных
		if (!player.name) {
			console.log(`загружаем name для ${uid}, заявитель ${params.source}`)
			player.name=await fbs_once('players/'+uid+'/name')
		}

		//загружаем картинку если нет данных
		if (!player.pic_url) {
			console.log(`загружаем pic_url для ${uid} ${player.name}, заявитель ${params.source}`)
			player.pic_url=await fbs_once('players/'+uid+'/pic_url')
		}

		//загружаем рейтинг если нет данных
		if (!player.rating||params.rating) {
			console.log(`загружаем rating для ${uid} ${player.name}, заявитель ${params.source}`)
			player.rating=await fbs_once('players/'+uid+'/rating')
		}

		//загружаем аватар если нет данных
		if (!player.texture) {
			console.log(`загружаем texture для ${uid} ${player.name}, заявитель ${params.source}`)
			player.texture=await this.my_texture_from(player.pic_url)
		}

		//переносим в game
		game.cache_updated(uid,player)

		//переносим в чат
		//chat.cache_updated(uid,player)

		//переносим в чат
		//lobby.cache_updated(uid,player)
		
		//в турнир
		//trnm.cache_updated(uid,player)

		//в игру
		//game.cache_updated(uid,player)

		delete this.loading[uid]

	},

	get_pdata(uid){

		if (!this[uid]) return 0
		if (!this[uid].texture) return 0
		return this[uid]
	},

	update_params(uid,params){

		//ссылка на игрока
		this[uid]||={}
		const player=this[uid]

		//загружаем картинку если нет данных
		if (params.pic_url) player.pic_url=params.pic_url

		//загружаем имя если нет данных
		if (params.name) player.name=params.name

		//загружаем рейтинг если нет данных
		if (params.rating) player.rating=params.rating
		
		//загружаем рейтинг если нет данных
		if (params.icon) player.icon=params.icon
	},

	my_texture_from(pic_url){

		const white_tex = PIXI.Texture.WHITE;

		if (!pic_url) return white_tex
		
		// Handle multiavatar
		if (pic_url.includes('mavatar')) pic_url = multiavatar(pic_url)
		
		return new Promise(res => {
			const timeout = setTimeout(() => {
			console.log('Timeout to load: ', pic_url);
			res(white_tex);
		}, 3000);

		PIXI.Texture.fromURL(pic_url).then(t => {
				clearTimeout(timeout);
				res(t||white_tex);
			})
			.catch((error) => {
				clearTimeout(timeout);
				console.error('Failed to load texture:', error);
				res(white_tex);
			});
		});

	},
	
	async update_avatar_forced(uid, pic_url){

		const player=this[uid];
		if(!player) alert('Не загружены базовые параметры '+uid);

		if(pic_url==='https://vk.com/images/camera_100.png')
			pic_url='https://akukamil.github.io/domino/vk_icon.png';

		//сохраняем
		player.pic_url=pic_url;

		//загружаем и записываем текстуру
		if (player.pic_url) player.texture=await this.my_texture_from(player.pic_url);

	},

}

auth2 = {

	load_script(src) {
	  return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.onload = () => resolve(1)
        script.onerror = () => resolve(0)
        script.src = src
        document.head.appendChild(script)
	  })
	},

	get_random_char() {

		const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		return chars[hf.randIntInc(0,chars.length-1)];

	},

	get_random_uid_for_local(prefix) {

		let uid = prefix;
		for ( let c = 0 ; c < 12 ; c++ )
			uid += this.get_random_char();

		//сохраняем этот uid в локальном хранилище
		try {
			localStorage.setItem('poker_uid', uid);
		} catch (e) {alert(e)}

		return uid;

	},

	get_random_name(uid) {

		const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		const rnd_names = ['Gamma','Chime','Dron','Perl','Onyx','Asti','Wolf','Roll','Lime','Cosy','Hot','Kent','Pony','Baker','Super','ZigZag','Magik','Alpha','Beta','Foxy','Fazer','King','Kid','Rock'];

		if (uid !== undefined) {

			let e_num1 = chars.indexOf(uid[3]) + chars.indexOf(uid[4]) + chars.indexOf(uid[5]) + chars.indexOf(uid[6]);
			e_num1 = Math.abs(e_num1) % (rnd_names.length - 1);
			let name_postfix = chars.indexOf(uid[7]).toString() + chars.indexOf(uid[8]).toString() + chars.indexOf(uid[9]).toString() ;
			return rnd_names[e_num1] + name_postfix.substring(0, 3);

		} else {

			let rnd_num = hf.randIntInc(0, rnd_names.length - 1);
			let rand_uid = hf.randIntInc(0, 999999)+ 100;
			let name_postfix = rand_uid.toString().substring(0, 3);
			let name =	rnd_names[rnd_num] + name_postfix;
			return name;
		}
	},

	async get_country_code () {

		let country_code = ''
		try {
			let resp1 = await fetch("https://ipinfo.io/json?token=a3455d3185ba47");
			let resp2 = await resp1.json();
			country_code = resp2.country;
		} catch(e){}

		return country_code;

	},

	search_in_local_storage() {

		//ищем в локальном хранилище
		let local_uid = null;

		try {
			local_uid = localStorage.getItem('poker_uid');
		} catch (e) {alert(e)}

		if (local_uid !== null) return local_uid;

		return undefined;

	},

	replace_bad_letter(s){
		
		//убираем ё и Ё
		return s.replace(/ё/g, 'е').replace(/Ё/g, 'Е')
		
	},

	async init() {

		if (game_platform === 'YANDEX') {

			try {await this.load_script('https://yandex.ru/games/sdk/v2')} catch (e) {alert(e)};

			let _player;

			try {
				window.ysdk = await YaGames.init({});
				_player = await window.ysdk.getPlayer();
			} catch (e) { alert(e)};

			my_data.uid = _player.getUniqueID().replace(/[\/+=]/g, '')
			my_data.name = _player.getName()
			my_data.name=this.replace_bad_letter(my_data.name)
			my_data.orig_pic_url = _player.getPhoto('medium')
			my_data.auth_mode=+_player.isAuthorized()

			if (my_data.orig_pic_url === 'https://games-sdk.yandex.ru/games/api/sdk/v1/player/avatar/0/islands-retina-medium')
				my_data.orig_pic_url = 'mavatar'+my_data.uid;

			if (my_data.name === '')
				my_data.name = this.get_random_name(my_data.uid);

			return;
		}

		if (game_platform === 'VK' || game_platform==='OK') {

			await this.load_script('https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js')||await this.load_script('https://akukamil.github.io/common/vkbridge.js');

			let _player;
			try {
				await vkBridge.send('VKWebAppInit');
				_player = await vkBridge.send('VKWebAppGetUserInfo');
			} catch (e) {alert(e)};

			my_data.name=_player.first_name + ' ' + _player.last_name
			my_data.name=this.replace_bad_letter(my_data.name)
			my_data.uid=game_platform.toLowerCase()+_player.id
			my_data.orig_pic_url=_player.photo_100
			my_data.auth_mode=1
			return;
		}

		if (game_platform === 'DEBUG') {

			my_data.name = my_data.uid = 'debug' + prompt('Отладка. Введите ID', 100);
			my_data.name = this.get_random_name(my_data.uid);
			my_data.orig_pic_url = 'mavatar'+my_data.uid;
			my_data.auth_mode=1
			return;
		}

		if (game_platform === 'UNKNOWN') {

			//если не нашли платформу
			//alert('Неизвестная платформа. Кто Вы?')
			my_data.uid = this.search_in_local_storage() || this.get_random_uid_for_local('LS_');
			my_data.name = this.get_random_name(my_data.uid);
			my_data.orig_pic_url = 'mavatar'+my_data.uid;
			my_data.auth_mode=1
		}
	}

}

function resize() {
    const vpw = document.body.clientWidth;  // Width of the viewport
    const vph = document.body.clientHeight; // Height of the viewport
    let nvw; // New game width
    let nvh; // New game height

    if (vph / vpw < M_HEIGHT / M_WIDTH) {
      nvh = vph;
      nvw = (nvh * M_WIDTH) / M_HEIGHT;
    } else {
      nvw = vpw;
      nvh = (nvw * M_HEIGHT) / M_WIDTH;
    }
    app.renderer.resize(nvw, nvh);
    app.stage.scale.set(nvw / M_WIDTH, nvh / M_HEIGHT);
}

main_loader={

	divide_texture(t,frame_w,frame_h, names){
		
		const frames_x=Math.floor(t.width/frame_w)
		const frames_y=Math.floor(t.height/frame_h)
			
		if (typeof(names)==='string'){
			assets[names]=[]
			let i=0
			for (let y=0;y<frames_y;y++){
				for (let x=0;x<frames_x;x++){
					const rect=new PIXI.Rectangle(x*frame_w, y*frame_h, frame_w, frame_h)
					assets[names][i]=new PIXI.Texture(t.baseTexture, rect)
					i++
				}
			}			
		}else{
			
			let i=0
			for (let y=0;y<frames_y;y++){
				for (let x=0;x<frames_x;x++){
					const rect=new PIXI.Rectangle(x*frame_w, y*frame_h, frame_w, frame_h)
					assets[names[i]]=new PIXI.Texture(t.baseTexture, rect)
					i++
				}
			}			
		}
	},

	async load1(){

		//ресурсы
		const loader=new PIXI.Loader();


		//добавляем основной загрузочный манифест
		loader.add('main_load_list',git_src+'load_list.txt');

		await new Promise(res=>loader.load(res))

		//переносим все в ассеты
		for (const res_name in loader.resources){
			const res=loader.resources[res_name];
			assets[res_name]=res.texture||res.sound||res.data;
		}



	},

	async load2(){

		const loader=new PIXI.Loader();

		//подпапка с ресурсами
		const lang_pack = ['RUS','ENG'][LANG];

		loader.add("m2_font", COM_URL+"/fonts/bahnschrift48/f.fnt");
		loader.add("m3_font", COM_URL+"/fonts/bahnschrift48s/f.fnt");
		loader.add('cards_symbols_pack', git_src+'res/cards_designs/cards_symbols_pack.png');

		//добавляем из листа загрузки
		const load_list=eval(assets.main_load_list);
		for (let i = 0; i < load_list.length; i++)
			if (load_list[i].class ==='sprite'|| load_list[i].class ==='image')
				loader.add(load_list[i].name, git_src+'res/'+lang_pack + '/' + load_list[i].name + '.' +  load_list[i].image_format);
		
		loader.onProgress.add(ldr=>{
			//objects.loader_bar_mask.width =  240*ldr.progress*0.01;
		});
		await new Promise(res=> loader.load(res));

		//переносим все в ассеты
		for (const res_name in loader.resources){
			const res=loader.resources[res_name];
			assets[res_name]=res.texture||res.sound||res.data;
		}


		//создаем ассеты стилей карт - сразу загружаем и масти и значения
		const cards_data=['2','3','4','5','6','7','8','9','10','11','12','13','14','c','h','s','d']
		for (let s=0;s<4;s++){			
			const bt_values=assets.cards_symbols_pack.baseTexture
			assets['cards_symbols'+s]={};
			for (let c = 0;c < cards_data.length;c++) {
				const card_data=cards_data[c];
				const rect = new PIXI.Rectangle(c*90, s*90, 90, 90);
				assets['cards_symbols'+s][card_data]=new PIXI.Texture(bt_values, rect);
			}
		}

		//создаем спрайты и массивы спрайтов и запускаем первую часть кода
		for (let i = 0; i < load_list.length; i++) {
			const obj_class = load_list[i].class;
			const obj_name = load_list[i].name;
			console.log('Processing: ' + obj_name)

			switch (obj_class) {
			case "sprite":
				objects[obj_name] = new PIXI.Sprite(assets[obj_name]);
				eval(load_list[i].code0);
				break;

			case "block":
				eval(load_list[i].code0);
				break;

			case "cont":
				eval(load_list[i].code0);
				break;

			case "array":
				const a_size=load_list[i].size;
				objects[obj_name]=[];
				for (let n=0;n<a_size;n++)
					eval(load_list[i].code0);
				break;
			}
		}

		//обрабатываем вторую часть кода в объектах
		for (let i = 0; i < load_list.length; i++) {
			const obj_class = load_list[i].class;
			const obj_name = load_list[i].name;
			console.log('Processing: ' + obj_name)


			switch (obj_class) {
			case "sprite":
				eval(load_list[i].code1);
				break;

			case "block":
				eval(load_list[i].code1);
				break;

			case "cont":
				eval(load_list[i].code1);
				break;

			case "array":
				const a_size=load_list[i].size;
					for (let n=0;n<a_size;n++)
						eval(load_list[i].code1);	;
				break;
			}
		}





		//objects.bcg.texture=assets.bcg;

	}

}

async function define_platform_and_language() {

	let s = window.location.href;

	if (s.includes('app-id=194151')) {
		game_platform = 'YANDEX';
		return;
	}

	if (s.includes('vk_ok_app_id')||s.includes('vk_ok_user_id')) {
		game_platform = 'OK';
		return;
	}


	if (s.includes('vk.com')||s.includes('vk.ru')||s.includes('vk_app_id')) {
		game_platform = 'VK';	
		return;
	}

	if (s.includes('google_play')) {
		game_platform = 'GOOGLE_PLAY';
		return;
	}

	if (s.includes('192.168.')||s.includes('127.0.')) {
		game_platform = 'DEBUG';
		return;
	}

	game_platform = 'UNKNOWN';

}

async function init_game_env(lang) {

	//git_src="https://akukamil.github.io/corners_gp/"
	git_src=""

	await define_platform_and_language()
	
	//авторизация
	await auth2.init()

	document.body.innerHTML='<style>html,body {margin: 0;padding: 0;height: 100%;}body {display: flex;align-items:center;justify-content: center;background-color: rgba(41,41,41,1)}</style>';

	const dw=M_WIDTH/document.body.clientWidth;
	const dh=M_HEIGHT/document.body.clientHeight;
	const resolution=Math.min(1.5,Math.max(dw,dh,1));
	const opts={width:M_WIDTH, height:M_HEIGHT,antialias:false,resolution,autoDensity:true};
	app.stage = new PIXI.Container()
	app.renderer = new PIXI.Renderer(opts)
	const c=document.body.appendChild(app.renderer.view)
	c.style['boxShadow'] = '0 0 15px #000000';

	//события изменения окна
	resize();
	window.addEventListener('resize', resize);

	//запускаем главный цикл
	main_loop.start();

	await main_loader.load1();
	await main_loader.load2();

	//доп функция для текста битмап
	PIXI.BitmapText.prototype.set2=function(text,w){
		const t=this.text=text;
		for (i=t.length;i>=0;i--){
			this.text=t.substring(0,i)
			if (this.width<w) return;
		}
	}

	//доп функция для применения текстуры к графу
	PIXI.Graphics.prototype.set_texture=function(texture){

		if(!texture) return;
		// Get the texture's original dimensions
		const textureWidth = texture.baseTexture.width;
		const textureHeight = texture.baseTexture.height;

		// Calculate the scale to fit the texture to the circle's size
		const scaleX = this.w / textureWidth;
		const scaleY = this.h / textureHeight;

		// Create a new matrix for the texture
		const matrix = new PIXI.Matrix();

		// Scale and translate the matrix to fit the circle
		matrix.scale(scaleX, scaleY);
		const radius=this.w*0.5;
		this.clear();
		this.beginTextureFill({texture,matrix});
		this.drawCircle(radius, radius, radius);
		this.endFill();

	}



	//инициируем файербейс
	if (firebase.apps.length===0) {
		firebase.initializeApp({
			apiKey: "AIzaSyDRT0ELbvVeyJJPZQlc36mNr4o_C6tJ2Mc",
			authDomain: "hrts-41d55.firebaseapp.com",
			databaseURL: "https://hrts-41d55-default-rtdb.europe-west1.firebasedatabase.app",
			projectId: "hrts-41d55",
			storageBucket: "hrts-41d55.firebasestorage.app",
			messagingSenderId: "881700269569",
			appId: "1:881700269569:web:578d865359bfecbd679a00"
		});
	}
	//короткое образ
	fbs=firebase.database();


	//это событие когда меняется видимость приложения
	//document.addEventListener("visibilitychange", function(){tabvis.change()});

	//загрузка сокета
	//objects.id_log.text='Подключение к серверу my_ws...'
	//await my_ws.init();
	
	//получаем данные
	//objects.id_log.text='Запрос к Google... '
	const other_data=await fbs_once('players/' + my_data.uid)

	my_data.rating = (other_data?.rating) || 1400
	my_data.games = (other_data?.games) || 0
	my_data.name = (other_data?.name) || my_data.name
	my_data.nick_tm = other_data?.nick_tm || 0
	my_data.avatar_tm = other_data?.avatar_tm || 0;
	
	//правильно определяем аватарку
	const _pic_url=other_data?.pic_url
	if (_pic_url && _pic_url.includes('mavatar'))
		my_data.pic_url=_pic_url
	else
		my_data.pic_url=my_data.orig_pic_url

	//загружаем мои данные в кэш
	players_cache.update_params(my_data.uid,{pic_url:my_data.pic_url,rating:my_data.rating,name:my_data.name})
	await players_cache.update(my_data.uid)

	//обновляем данные в файербейс так как могли поменяться имя или фото	
	await fbs.ref('players/'+my_data.uid).set({
		name:my_data.name,
		pic_url:my_data.pic_url,
		rating:my_data.rating,
		games:my_data.games,
		nick_tm:my_data.nick_tm,
		avatar_tm:my_data.avatar_tm,
		tm:firebase.database.ServerValue.TIMESTAMP
	})	


	//подписываемся на новые сообщения
	//fbs.ref('inbox/'+my_data.uid).set({tm:Date.now()})
	//fbs.ref('inbox/'+my_data.uid).on('value', s => {process_new_message(s.val())})
		
	tablesMenu.activate()
}

main_loop={
	

	lastTime:0,	
	
	start(fps){
	
		TM.ms = 0
		TM.s=0
		this.run(TM.ms)
		
	},
	
	run(t){		
		
		const delta = t - this.lastTime							
		const cap_delta = Math.min(delta,16.666)	
					
		TM.ms=t
		TM.s=TM.ms*0.001					
					
		anim3.process()

		//обрабатываем минипроцессы
		for (const key in some_process)
			some_process[key](cap_delta)

		app.renderer.render(app.stage)			
		
		this.lastTime = t
		requestAnimationFrame(main_loop.run.bind(this))	
		
	}	
	
}

