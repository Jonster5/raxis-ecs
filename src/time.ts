import { ECS, ECSPlugin } from './ecs';

export class Time {
	constructor(
		public elapsed: number,
		public delta: number,
		public then: number
	) {}
}

function updateTime(ecs: ECS) {
	const time = ecs.getResource(Time);
	const now = performance.now();

	time.delta = now - time.then;
	time.elapsed += time.delta;
	time.then = now;
}

export const TimePlugin: ECSPlugin = {
	components: [],
	startup: [],
	systems: [updateTime],
	resources: [new Time(0, 0, 0)],
};
