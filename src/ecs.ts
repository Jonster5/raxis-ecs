import { EntityControls } from './entityControls';

export type CompType = new (...args: any[]) => any;
export type Executor = (ecs: ECS, ...args: any) => any[] | void;
export type System = {
	executor: Executor;
	name: string;
	enabled: boolean;
};

export type Plugin = {
	components: CompType[];
	sets: {
		[key: string]: Executor[];
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
	private nextEID: number;

	private systems: System[];

	private resources: Map<CompType, any>;

	constructor() {
		this.components = {};
		this.systems = [];
		this.resources = new Map();

		this.nextEID = 0;
	}

	registerComponentType(component: CompType) {
		const name = component.name;

		this.components[name] = [];

		return this;
	}

	registerSystem(executor: Executor) {
		const system: System = {
			enabled: true,
			name: executor.name,
			executor,
		};

		this.systems.push(system);

		return this;
	}

	registerSystems(...executors: Executor[]) {
		executors.forEach((executor) => this.registerSystem(executor));
	}

	toggleSystem(executor: Executor | string) {
		const exec = typeof executor === 'string' ? executor : executor.name;

		const system = this.systems.find(({ name }) => name === exec);

		if (system === undefined) {
			throw new Error(`System [${exec}] is not registered`);
		} else {
			system.enabled = !system.enabled;
		}
	}

	createResource(type: CompType, resource: any) {
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

	run(...args: any) {
		let out = undefined;

		if (this.systems[0].enabled) {
			out = this.systems[0].executor(this, ...args);
		}

		for (let i = 1; i < this.systems.length; i++) {
			if (!this.systems[i].enabled) {
				out = undefined;
				continue;
			}

			if (out) out = this.systems[i].executor(this, ...out);
			else out = this.systems[i].executor(this);
		}
	}
}
