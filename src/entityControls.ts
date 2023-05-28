import { CompType, ECS } from './ecs';

export class EntityControls {
	private readonly eid: number;
	private isValid: boolean;
	private ecs: ECS;
	private components: {
		[key: string]: any[];
	};

	constructor(
		ecs: ECS,
		compRef: {
			[key: string]: any[];
		},
		eid: number
	) {
		this.ecs = ecs;
		this.components = compRef;
		this.eid = eid;
		this.isValid = true;
	}

	addComponent(component: any) {
		if (!this.isValid) {
			throw new Error(
				`Entities cannot be modified after being destroyed`
			);
		}

		const compType = component.constructor as CompType;
		const name = compType.name;

		if (this.components[name] === undefined) {
			throw new Error(`The component type [${name}] is not registered`);
		}

		if (this.components[name][this.eid] !== undefined) {
			throw new Error(
				`There is already an instance of [${name}] on this entity`
			);
		}

		this.components[name][this.eid] = component;
	}

	getComponent(component: CompType) {
		if (!this.isValid) {
			throw new Error(
				`Entities cannot be modified after being destroyed`
			);
		}

		const name = component.name;

		if (this.components[name] === undefined) {
			throw new Error(`The component type [${name}] is not registered`);
		}

		if (this.components[name][this.eid] === undefined) {
			throw new Error(`There is no instance of [${name}] on this entity`);
		}

		return this.components[name][this.eid];
	}

	add(...components: any[]) {
		components.forEach((c) => this.addComponent(c));
	}

	get(...components: CompType[]) {
		return components.map((c) => this.getComponent(c));
	}

	removeComponent(component: any) {
		if (!this.isValid) {
			throw new Error(
				`Entities cannot be modified after being destroyed`
			);
		}

		const compType = component.constructor as CompType;
		const name = compType.name;

		if (this.components[name] === undefined) {
			throw new Error(`Component Type [${name}] is not registered`);
		}

		const cIndex = this.components[name].indexOf(component);

		if (cIndex === -1) {
			throw new Error(
				`This instance of [${name}] component type does not exist on any entity`
			);
		}

		delete this.components[name][cIndex];
	}

	destroy() {
		this.ecs.destroy(this.eid);
		this.isValid = false;
	}

	id() {
		return this.eid;
	}
}
