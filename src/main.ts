import { ECS, With, Without } from './ecs';
import './style.css';

class Position {
	constructor(public x: number, public y: number) {}
}

class Title {
	constructor(public title: string) {}
}

class Time {
	constructor(
		public elapsed: number,
		public delta: number,
		public then: number
	) {}
}

class Enemy {}

class Player {}

const ecs = new ECS();

ecs.registerComponentType(Position)
	.registerComponentType(Title)
	.registerComponentType(Player)
	.registerComponentType(Enemy);

ecs.createResource(Time, new Time(0, 0, 0));

ecs.registerSystems(updateTime, move, printPosition, loop);

ecs.entity().add(new Player(), new Position(25, 25));

for (let i = 0; i < 10000; i++) {
	ecs.entity().add(
		new Enemy(),
		new Title(`Enemy ${i + 1}`),
		new Position(
			Math.floor(Math.random() * 100),
			Math.floor(Math.random() * 100)
		)
	);

	ecs.entity().add(
		new Enemy(),
		new Position(
			Math.floor(Math.random() * 100),
			Math.floor(Math.random() * 100)
		)
	);
}

function updateTime(ecs: ECS) {
	const time = ecs.getResource(Time);
	const now = performance.now();

	time.delta = now - time.then;
	time.elapsed += time.delta;
	time.then = now;

	return [time];
}

function move(ecs: ECS, time: Time) {
	const positions: Position[] = ecs.queryComponents(Position, With(Player));

	positions.forEach((p) => {
		p.x += 1 * time.delta;
		p.y += 15 * time.delta;
	});
}

function printPosition(ecs: ECS) {
	const positions: Position[] = ecs.queryComponents(Position, With(Player));

	console.log(positions[0].x);
}

function loop(ecs: ECS) {
	requestAnimationFrame(ecs.run.bind(ecs));
}

ecs.run();
