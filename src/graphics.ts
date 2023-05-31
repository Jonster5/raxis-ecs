import { Vec2 } from 'raxis-core';
import { ECS, ECSPlugin } from './ecs';

export class GraphicsSettings {
	constructor(
		public target: HTMLElement = document.body,
		public width: number = 1000,
		public ups: number = 60
	) {}
}

export class Canvas {
	constructor(
		public target: HTMLElement,
		public element: HTMLCanvasElement,
		public ctx: CanvasRenderingContext2D,
		public ups: number,
		public aspect: number,
		public size: Vec2,
		public def: DOMMatrix,
		public root: number | null
	) {}
}

export class Relationship {
	constructor(
		public parent: number | null = null,
		public children: number[] = []
	) {}
}

export class Root {}

export class Transform {
	constructor(
		public pos: Vec2 = new Vec2(0, 0),
		public vel: Vec2 = new Vec2(0, 0),
		public size: Vec2 = new Vec2(0, 0),
		public angle: number = 0,
		public avel: number = 0,
		public last: {
			pos: Vec2;
			angle: number;
		} = {
			pos: new Vec2(0, 0),
			angle: new Vec2(0, 0),
		}
	) {}
}

export class Sprite {
	constructor(
		public visible: boolean,
		public filter: string,
		public alpha: number,
		public texture: string | CanvasGradient | CanvasPattern,
		public borderColor: string,
		public borderWidth: number
	) {}
}

export class Rectangle {}

export class Ellipse {}

export class TextureMaterial {
	constructor() {}
}

function setupCanvas(ecs: ECS) {
	const { target, width, ups }: GraphicsSettings =
		ecs.getResource(GraphicsSettings);

	const element = document.createElement('canvas');
	const ctx = element.getContext('2d')!;

	const dpr = window.devicePixelRatio ?? 1;

	const aspect = window.innerWidth / window.innerHeight;

	const size = new Vec2(width, width / aspect);

	element.width = size.x * dpr;
	element.height = size.y * dpr;
	ctx.transform(dpr, 0, 0, -dpr, element.width / 2, element.height / 2);

	const def = ctx.getTransform();

	element.setAttribute(
		'style',
		`display: block; width: 100%; height: 100%; border: none; background: transparent`
	);

	element.addEventListener('contextmenu', (e) => e.preventDefault());

	target.appendChild(element);

	const root = ecs
		.entity()
		.add(new Sprite(true), new Transform(), new Relationship(), new Root());

	const canvas = ecs
		.entity()
		.add(
			new Canvas(target, element, ctx, ups, aspect, size, def, root.id()),
			new Relationship(null, [root.id()])
		);

	root.getComponent(Relationship).parent = canvas.id();
}

function render(ecs: ECS) {}

export const GraphicsPlugin: ECSPlugin = {
	components: [Canvas, Transform, Relationship, Sprite, Root],
	startup: [setupCanvas],
	systems: [render],
};
