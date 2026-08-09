"use strict";

//создаем массив карт
const suits = ['h', 'd', 's', 'c']
const cards_lib = []
for (let suitIndex = 0; suitIndex < suits.length; suitIndex++) {
    for (let value = 2; value <= 14; value++) {
        cards_lib.push({ suit: suits[suitIndex], val: value });
    }
}

const TWO_OF_CUBES_INDEX=cards_lib.findIndex(c=>{return c.suit==='c'&&c.val===2});
const QUEEN_OF_SPADES_INDEX=cards_lib.findIndex(c=>{return c.suit==='s'&&c.val===12});

const EVENTS={
	INIT_GAME:0,
	PASSING_START:1,
	PASSING_FIN:2,
	MOVE:3,
	TRICK_START:4,
	TRICK_FIN:5	,
	MOVE_FROM_PLAYER:6
}

function randIntInc(min,max){
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1) + min)
}

function generateRandomBase64(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789()';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * 64);
        result += chars[randomIndex];
    }
    return result;
}

function createSeededShuffledArray(N, seed) {
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

//короткое обращение к файербейс
const fbs=firebase.database();

const fbs_once=async function(path){
	const v=await fbs.ref(path).get()
	return v.val()
}

class player_class{
	
	constructor(params={}){
		
		this.ai=params.ai
		this.passingResolver=0
		this.passingCards=0
		this.moveResolver=0
		this.cardsTaken=[]

		this.hand=[]
		this.index=params.index
		this.lastPlayed=0
		this.uid=params.uid||('aiPlayer'+params.index)		
	}
	
	async waitPassingCards(){

		if (this.ai) {
			this.passingCards=this.getRandomCardsForExchange()
			return
		}
		
		return new Promise(r=>{
			
			const timer = setTimeout(()=>{
				this.ai=1
				if (!this.passingResolver) return
				this.passingResolver({cards:this.getRandomCardsForExchange()})				
				console.log('таймаут ожидания карт для обмена!')
			},15_000)
			
			this.passingResolver=data=>{
				r(1)
				this.passingResolver=null
				this.passingCards=data.cards
				clearTimeout(timer)
				console.log('Получены карты для обмена!',data.cards,data.uid)
			}			
		})
	}
	
	getRandomCardsForExchange(){
		
		const arr=createSeededShuffledArray(13,generateRandomBase64(8))
		//const arr=createSeededShuffledArray(13,'gr')
		return [
			this.hand[arr[0]],
			this.hand[arr[1]],
			this.hand[arr[2]]
		]		
	}
	
	getRandomCardForMove(leadingSuit,heartsBroken){
				
		const twoClubsIndex = this.hand.indexOf(TWO_OF_CUBES_INDEX)
		if (twoClubsIndex!==-1){
			return TWO_OF_CUBES_INDEX;			
		}
		
		let available = [];

		if (leadingSuit) {
			// обязаны положить карту масти хода
			available = this.hand.filter(cardIndex =>
				cards_lib[cardIndex].suit === leadingSuit
			);

			// если такой масти нет — можно любую
			if (available.length === 0)
				available = this.hand.slice();

		} else {
			// игрок начинает взятку

			if (heartsBroken) {
				available = this.hand.slice();
			} else {
				// нельзя начинать с червей, если есть другие масти
				available = this.hand.filter(cardIndex =>
					cards_lib[cardIndex].suit !== 'h'
				);

				// если только червы — разрешаем
				if (available.length === 0)
					available = this.hand.slice();
			}
		}

		const card = available[randIntInc(0,available.length-1)]

		return card;
	}
	
	waitMoveData(leadingPlayer,heartsBroken){

		
		const leadingSuit=leadingPlayer?leadingPlayer.lastPlayed.suit:0
		
		//ход ии
		if (this.ai) {
			return new Promise(r=>{
				setTimeout(()=>{
					const cardIndex=this.getRandomCardForMove(leadingSuit,heartsBroken)
					if (cardIndex===undefined)
						console.log(123)
					const data={cardIndex}
					r(data)
				},500)	
			})
		}		
		
		return new Promise(r=>{
			
			//если игрок не сделал ход то переключаемя на ии
			const timer = setTimeout(()=>{
				this.ai=1
				if (!this.moveResolver) return
				const cardIndex=this.getRandomCardForMove(leadingSuit,heartsBroken)
				const data={cardIndex,ai:1}
				this.moveResolver(data)
			},15_000)			
			
			this.moveResolver=card=>{
				r(card)
				this.moveResolver=null
				clearTimeout(timer)
			}	

			//console.log(123)
		})
	}
}

class table_class{
	
	constructor(id){
		
		this.id=id
		this.players=[]
		this.passingToken=''
		this.moveReqToken=''
		this.playerToMoveUID=0
		this.heartsBroken=0
		this.trickLeaderPlayer=0
		
		fbs.ref(`table${this.id}/players`).remove()
		
		fbs.ref(`table${id}/from_players`).on('value', s => {
			this.evensFromPlayers(s.val())
		})
		
	}
		
	getCardsPenalty(cards){
		
		let sum=0
		for (const cardData of cards){			

			if (cardData.suit==='h') sum++
			if (cardData.index===QUEEN_OF_SPADES_INDEX) sum+=13
		}		
		return sum

	}
	
	getLosePlayer(cards){
		
		let losePlayer=this.trickLeaderPlayer				
		for (const player of this.players){			
			const pSuit=player.lastPlayed.suit
			const pVal=player.lastPlayed.val			
			if (pSuit===losePlayer.lastPlayed.suit&&pVal>losePlayer.lastPlayed.val)				
				losePlayer=player	
		}				
		return losePlayer
		
	}
	
	getPlayerWith2C(){
		
		for (const player of this.players)
			if (player.hand.includes(TWO_OF_CUBES_INDEX))
				return player.index
			
		console.log('!!!!!!!!Не нашли игрока с 2 треф!!!')
	}

	evensFromPlayers(data){		
		
		console.log('evensFromPlayers',data)
		if(!data) return
		
		if (data.e===EVENTS.PASSING_FIN&&data.token===this.passingToken){
			const player=this.players.find(p=>p.uid===data.uid)
			if(player) player?.passingResolver(data)
			
		}

		//move - это индекс карты
		if (data.e===EVENTS.MOVE_FROM_PLAYER&&this.playerToMoveUID===data.uid){
			const player=this.players.find(p=>p.uid===data.uid)
			if(player) player?.moveResolver({cardIndex:data.cardIndex})
		}
			
	}

	async process(){

		while(1){

			let pending_players=await fbs_once(`table${this.id}/players`)
			
			if (!pending_players||typeof(pending_players)!=='object'){
				console.log('нет данных об игроках')
				await new Promise(r => setTimeout(r, 5000))
				continue
			}		
			
			
			//удаляем старых
			const tm=Date.now()
			for (const uid of Object.keys(pending_players)){
				const tm2=pending_players[uid]
				if (tm-tm2>200_000){
					delete pending_players[uid]					
					await fbs.ref(`table${this.id}/players/${uid}`).remove()
				}			
			}		
			
			pending_players=Object.keys(pending_players)
			
			if (!pending_players.length){
				console.log('нет игроков')
				fbs.ref(`table${this.id}/state`).set({noplayers:1})
				await new Promise(r => setTimeout(r, 5000))
				continue
			}

			//создаем игроков и добавляем ии если не хватает
			for (let i=0;i<4;i++){
				if (i<pending_players.length)
					this.players[i]=new player_class({ai:0,uid:pending_players[i],index:i})
				else
					this.players[i]=new player_class({ai:1,index:i})
			}			

			//записываем утвержденных игроков
			await fbs.ref(`table${this.id}/admPlayers`).set([
				this.players[0].uid,
				this.players[1].uid,
				this.players[2].uid,
				this.players[3].uid
			])
			
			

			//случайный сид для перемешивания колоды
			const seed=generateRandomBase64(5)
			
			this.heartsBroken=0
			
			//получаем случайную колоду
			const randCardsRef=createSeededShuffledArray(52,seed)
			
			//распределяем карты по игрокам
			console.log('распределяем карты по игрокам')
			for (let p=0;p<4;p++){
				const player=this.players[p]
				player.hand=[]
				for (let c=0;c<13;c++)
					player.hand.push(randCardsRef[p*13+c])
			}
			
			fbs.ref(`table${this.id}/state`).set({passing:1})
			
			//начало игры, игроки и сид - ожидание загрузки на клиенте, passing
			//seed - это также passingToken
			this.passingToken=seed
			fbs.ref(`table${this.id}/from_server`).set({
				e:EVENTS.INIT_GAME,
				uids:[
					this.players[0].uid,
					this.players[1].uid,
					this.players[2].uid,
					this.players[3].uid
				],
				seed
			})
			
			
			
			//fbs.ref(`table${this.id}/state1`).set('on')
			
			//await new Promise(r => setTimeout(r, 2000))

			//ждем выбор карт от игроков для обмена
			console.log('ждем выбор карт от игроков для обмена')
			await Promise.all([
				this.players[0].waitPassingCards(),
				this.players[1].waitPassingCards(),
				this.players[2].waitPassingCards(),
				this.players[3].waitPassingCards()
			])

			//вычисляем по какой схеме будет отмен
			const passingSchemeIndex=createSeededShuffledArray(4,seed)[0]
			const passingSchemes=[
				[[0,1],[1,2],[2,3],[3,0]],
				[[0,2],[1,3],[2,0],[3,1]],
				[[0,1],[1,2],[2,3],[3,0]],
				[[0,1],[1,2],[2,3],[3,0]],
			]
			const passingScheme=passingSchemes[0]
	
			//применяем обмен
			this.players.forEach((p,i) => {
				
				const fromPlayerIndex=passingScheme[i][0]
				const toPlayerIndex=passingScheme[i][1]
				
				const curPlayer=this.players[i]
				const fromPlayer=this.players[fromPlayerIndex]
				const toPlayer=this.players[toPlayerIndex]
				
				//у каждого убираем карты
				curPlayer.hand=curPlayer.hand.filter(c =>!curPlayer.passingCards.includes(c))
				
				//добавляем карты от соответствующего игрока
				toPlayer.hand.push(...fromPlayer.passingCards)

			})			
						
						
			console.log('все карты выбраны...')			
			
			//если все ии то выходим
			if (this.players.every(p=>p.ai===1)){
				console.log('Все ИИ выходим...')
				continue
			}
						
			//определяем первого игрока
			let nextPlayerIndex=this.getPlayerWith2C()
			//this.movePlayerToStart(playerIndexWith2C)

			//отправляем карты для обмена игрокам и первого кто ходит
			fbs.ref(`table${this.id}/from_server`).set({
				e:EVENTS.PASSING_FIN,
				cards:[
					this.players[0].passingCards,				
					this.players[1].passingCards,
					this.players[2].passingCards,
					this.players[3].passingCards
				],
				ai:this.players.map(p=>p.ai),
				nextPlayerIndex,
				tm:Date.now()
			})		

			await new Promise(r=>setTimeout(r,3000))
						
			//продолжаем игру
			mainLoop:for (let i=0;i<13;i++){				
				
				
				fbs.ref(`table${this.id}/state`).set({playing:i})
				
				this.trickLeaderPlayer=0
				
				for (let p=0;p<4;p++){
					
					const playerToMoveIndex=nextPlayerIndex
					const player=this.players[nextPlayerIndex]
					
					//this.moveReqToken=generateRandomBase64(7)
					this.playerToMoveUID=player.uid
					
					//в начале каждого трика (кроме самого первого, там эта информация идет с exch) запускаем кто ходит
					if (i>0&&p===0){
						fbs.ref(`table${this.id}/from_server`).set({
							e:EVENTS.TRICK_START,
							nextPlayerIndex,
							tm:Date.now()
						})
					}
					
					console.log('Ждем ход от ',player.uid)
					const moveData=await player.waitMoveData(this.trickLeaderPlayer,this.heartsBroken)
					const cardData=cards_lib[moveData.cardIndex]
					if(!this.trickLeaderPlayer) this.trickLeaderPlayer=player
					player.lastPlayed=cardData
					console.log('Получили ход от ',player.index,cardData)
					
					//удаляем из руки
					player.hand.splice(player.hand.indexOf(moveData.cardIndex), 1);

					if (!this.heartsBroken&&cardData.suit==='h'){
						this.heartsBroken=1
						console.log('Червы разбиты')
					}

					//следующий по очереди
					nextPlayerIndex=p==3?-1:(++nextPlayerIndex)%4
					
					
					//отправляем информацию всем игрокам ---------------
					const sendInfo={
						e:EVENTS.MOVE_FROM_PLAYER,
						cardIndex:moveData.cardIndex,
						pIndex:playerToMoveIndex,
						nextPlayerIndex,
						tm:Date.now()
					}
					
					//если это окончание трика
					if (p===3) sendInfo.trickFin=i
					
					//если произошло изменение на ии то уведомляем всех
					if (moveData.ai) {
						console.log(`Игрок ${player.uid} теперь ИИ !`)
						sendInfo.ai=1						
						//если все ии то выходим
						if (this.players.every(p=>p.ai===1)){
							console.log('Все ИИ выходим...')
							break mainLoop
						}						
					}
					
					fbs.ref(`table${this.id}/from_server`).set(sendInfo)
					
					console.log('send')
					
					//await new Promise(r=>setTimeout(r,3000))
				}
				
				fbs.ref(`table${this.id}/state`).set({fin:1})
				
				//return
				//вычисляем кто больше всего взял очков и делаем его первым в очереди на ход
				const losePlayer=this.getLosePlayer()
				const allPlayedCards=this.players.map(p=>p.lastPlayed)
				losePlayer.cardsTaken.push(...allPlayedCards)
				nextPlayerIndex=losePlayer.index
				console.log('Забрал все: ',nextPlayerIndex)
				
				
				await new Promise(r =>setTimeout(r,2000))
			}

			//считаем очки
			/*for (const player of this.players){				
				player.score_penalty=this.getCardsPenalty(player.cardsTaken)
				if (player.score_penalty===26){
					player.score_penalty=0
					for (const p of this.players)
						if (p!==player)	p.score_penalty=26
					break
				}				
			}*/

			console.log('партия окончена, следующая через 10 сек')
			await new Promise(r => setTimeout(r, 10_000))
			
			
		}
	}

}


const table=new table_class(1)
table.process()