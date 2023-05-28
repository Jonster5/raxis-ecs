import { EntityControls } from './entityControls';

export type CompType = new (...args: any[]) => any;
export type System = (ecs: ECS, ...args: any) => any[] | void;

export type Plugin = {
	components: CompType[];
	sets: {
		[key: string]: System[];
	};
};

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
	private systems: {
		executor: System;
		name: string;
		enabled: boolean;
	}[];
	private resources: Map<CompType, any>;

	private nextEID: number;

	constructor() {
		this.components = {};
		this.systems = [];
		this.resources = new Map();

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

	registerComponentTypes(...comps: CompType[]) {
		comps.forEach((c) => this.registerComponentType(c));
	}

	registerSystems(...systems: System[]) {
		systems.forEach((s) => this.registerSystem(s));
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

	createResource(resource: any) {
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

	entity() {
		return new EntityControls(this, this.components, this.nextEID++);
	}

	controls(eid: number) {
		return new EntityControls(this, this.components, eid);
	}

	destroy(entity: number) {
		for (let key in this.components) {
			delete this.components[key][entity];
			this.components[key].splice(entity, 1);
			this.nextEID--;
		}
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

	// queryEntities(...mods: CompTypeMod[]): any[] {}

	run(start?: System, ...args: any[]) {
		let out = undefined;
		let startIndex = 0;

		if (start) {
			startIndex = this.systems.findIndex(
				({ executor }) => executor === start
			);

			if (startIndex === -1) {
				throw new Error(`System [${start.name}]`);
			}
		}

		if (this.systems[startIndex].enabled) {
			out = this.systems[startIndex].executor(this, ...args);
		}

		for (let i = startIndex + 1; i < this.systems.length; i++) {
			if (!this.systems[i].enabled) {
				out = undefined;
				continue;
			}

			if (out) out = this.systems[i].executor(this, ...out);
			else out = this.systems[i].executor(this);
		}
	}
}
