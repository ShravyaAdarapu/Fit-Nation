import type {Equipment} from './branches';

// Design-only inventories requested by the owner. Replace per branch with the
// approved inventory and set equipmentIsSample=false when real data arrives.
function inventory(treadmills:number,bikes:number,benches:number,racks:number):Equipment[]{return [
 {category:'Free weights',items:[{name:'Dumbbell pairs',quantity:20,detail:'2.5–50 kg range'},{name:'Olympic barbells',quantity:6,detail:'20 kg bars'},{name:'Adjustable benches',quantity:benches},{name:'EZ curl bars',quantity:2}]},
 {category:'Strength machines',items:[{name:'Squat racks',quantity:racks},{name:'Cable crossover',quantity:2},{name:'Leg press',quantity:1},{name:'Lat pulldown',quantity:2},{name:'Smith machine',quantity:1},{name:'Chest press',quantity:1}]},
 {category:'Cardio',items:[{name:'Treadmills',quantity:treadmills,detail:'Incline & interval settings'},{name:'Exercise bikes',quantity:bikes},{name:'Cross trainers',quantity:3},{name:'Rowing machines',quantity:2}]},
 {category:'Functional training',items:[{name:'Kettlebells',quantity:12,detail:'4–24 kg range'},{name:'Battle ropes',quantity:2},{name:'Plyometric boxes',quantity:3},{name:'Exercise mats',quantity:15},{name:'Resistance band sets',quantity:6}]},
 ];}
export const sampleEquipment:Record<string,Equipment[]>={kothapet:inventory(6,4,5,2),hayathnagar:inventory(4,3,4,2),moosarambagh:inventory(5,3,4,1),nagole:inventory(8,4,6,3)};
