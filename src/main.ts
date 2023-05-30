import { ECS, With, Without, Plugin } from './ecs';
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

const plugin: Plugin = {
	components: [Position, Title, Enemy, Player],
	startup: [setup],
	systems: [updateTime, move, printPosition],
};

function setup(ecs: ECS) {
	ecs.insertResource(new Time(0, 0, 0));

	ecs.entity().add(new Player(), new Position(0, 25));

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
}

function updateTime(ecs: ECS) {
	const time = ecs.getResource(Time);
	const now = performance.now();

	time.delta = now - time.then;
	time.elapsed += time.delta;
	time.then = now;
}

function move(ecs: ECS) {
	const positions: Position[] = ecs.queryComponents(Position, With(Player));
	const time = ecs.getResource(Time);

	positions.forEach((p) => {
		p.x += (1 * time.delta) / 1000;
		p.y += (15 * time.delta) / 1000;
	});
}

function printPosition(ecs: ECS) {
	const positions: Position[] = ecs.queryComponents(Position, With(Player));
	const player = ecs.queryEntities(With(Player));

	console.log(ecs.controls(player[0]).getComponent(Position).x);
}

ecs.insertPlugin(plugin);

ecs.run();
