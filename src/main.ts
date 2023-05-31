import { ECS, With, Without, ECSPlugin } from './ecs';
import { GraphicsSettings, GraphicsPlugin } from './graphics';
import './style.css';
import { TimePlugin } from './time';

const ecs = new ECS()
	.insertResource(new GraphicsSettings(document.body, 1000, 30))
	.insertPlugin(TimePlugin)
	.insertPlugin(GraphicsPlugin)
	.run();
