import { EntityControls } from './entityControls';

export type CompType = new (...args: any[]) => any;
export type System = (ecs: ECS) => any[] | void;

export interface ECSPlugin {
	components?: CompType[];
	startup?: System[];
	systems?: System[];
	resources?: any[];
}

export type CompTypeMod = () => [CompType, ModType];
export type ModType = 'with' | 'without';

export const With = (c: CompType): CompTypeMod => {
	return () => [c, 'with'];
};

export const Without = (c: CompType): CompTypeMod => {
	return () => [c, 'without'];
};

export class ECS {
	private components: {
		[key: string]: any[];
	};
	private entities: number[];
	private startSystems: {
		executor: System;
		name: string;
		enabled: boolean;
	}[];
	private systems: {
		executor: System;
		name: string;
		enabled: boolean;
	}[];
	private resources: Map<CompType, any>;

	private updater!: number | null;

	private nextEID: number;

	constructor() {
		this.components = {};
		this.entities = [];
		this.startSystems = [];
		this.systems = [];
		this.resources = new Map();

		this.updater = null;
		this.nextEID = 0;
	}

	registerComponentType(component: CompType) {
		const name = component.name;

		this.components[name] = [];
	}

	registerSystem(system: System) {
		this.systems.push({
			enabled: true,
			name: system.name,
			executor: system,
		});
	}

	registerStartupSystem(system: System) {
		this.startSystems.push({
			enabled: true,
			name: system.name,
			executor: system,
		});
	}

	registerComponentTypes(...comps: CompType[]) {
		comps.forEach((c) => this.registerComponentType(c));
	}

	registerSystems(...systems: System[]) {
		systems.forEach((s) => this.registerSystem(s));
	}

	registerStartupSystems(...systems: System[]) {
		systems.forEach((s) => this.registerStartupSystem(s));
	}

	toggleSystem(system: System | string) {
		const sysname = typeof system === 'string' ? system : system.name;

		const sys = this.systems.find(({ name }) => name === sysname);

		if (sys === undefined) {
			throw new Error(`System [${sysname}] is not registered`);
		} else {
			sys.enabled = !sys.enabled;
		}
	}

	insertResource(resource: any) {
		const type: CompType = resource.constructor;

		if (this.resources.get(type) !== undefined) {
			throw new Error(`Resource of type [${type.name}] already exists`);
		}

		if (!(resource instanceof type)) {
			throw new Error(
				`Resource type [${resource.constructor.name}] does not match the type [${type.name}]`
			);
		}

		this.resources.set(type, resource);

		return this;
	}

	insertPlugin(plugin: ECSPlugin) {
		if (plugin.resources) {
			plugin.resources.forEach((r) => this.insertResource(r));
		}

		if (plugin.components) {
			this.registerComponentTypes(...plugin.components);
		}

		if (plugin.startup) {
			this.registerStartupSystems(...plugin.startup);
		}

		if (plugin.systems) {
			this.registerSystems(...plugin.systems);
		}

		return this;
	}

	entity() {
		const eid = this.nextEID++;

		this.entities.push(eid);

		return new EntityControls(this, this.components, eid);
	}

	controls(eid: number) {
		return new EntityControls(this, this.components, eid);
	}

	destroy(eid: number) {
		const index = this.entities.indexOf(eid);

		if (index === -1) {
			throw new Error(`Entity does not exist`);
		}

		for (let key in this.components) {
			delete this.components[key][eid];
		}

		this.entities.splice(index, 1);
	}

	getResource(type: CompType) {
		if (this.resources.get(type) === undefined) {
			throw new Error(`Resource of type [${type.name}] does not exist`);
		}

		return this.resources.get(type);
	}

	queryComponents(comp: CompType, ...mods: CompTypeMod[]): any[] {
		const name = (comp as CompType).name;

		if (this.components[name] === undefined) {
			throw new Error(`The component type [${name}] is not registered`);
		}

		let retrieval: { comp: CompType; eid: number }[] = [];

		for (let i in this.components[name]) {
			retrieval.push({
				comp: this.components[name][i],
				eid: parseInt(i),
			});
		}

		for (let mod of mods) {
			const [comp, type] = mod();

			if (type === 'with') {
				retrieval = retrieval.filter(
					(item) => this.components[comp.name][item.eid] !== undefined
				);
			} else {
				retrieval = retrieval.filter(
					(item) => this.components[comp.name][item.eid] === undefined
				);
			}
		}

		return retrieval.map(({ comp }) => comp);
	}

	queryEntities(mod: CompTypeMod, ...othermods: CompTypeMod[]): number[] {
		let retrieval = [...this.entities];

		const [comp, type] = mod();

		if (type === 'with') {
			retrieval = retrieval.filter(
				(eid) => this.components[comp.name][eid] !== undefined
			);
		} else {
			retrieval = retrieval.filter(
				(eid) => this.components[comp.name][eid] === undefined
			);
		}

		for (let mod of othermods) {
			const [comp, type] = mod();

			if (type === 'with') {
				retrieval = retrieval.filter(
					(eid) => this.components[comp.name][eid] !== undefined
				);
			} else {
				retrieval = retrieval.filter(
					(eid) => this.components[comp.name][eid] === undefined
				);
			}
		}

		return retrieval;
	}

	run() {
		this.startup();

		this.update();
	}

	startup() {
		for (let i = 0; i < this.startSystems.length; i++) {
			if (!this.startSystems[i].enabled) continue;

			this.startSystems[i].executor(this);
		}
	}

	update() {
		for (let i = 0; i < this.systems.length; i++) {
			if (!this.systems[i].enabled) continue;

			this.systems[i].executor(this);
		}

		this.updater = requestAnimationFrame(this.update.bind(this));
	}

	stop() {
		if (!this.updater) {
			throw new Error(`ECS is not running`);
		}

		cancelAnimationFrame(this.updater);

		this.updater = null;
	}
}
