import {
	RECYCLED_NODE,
	EMPTY_OBJECT,
	EMPTY_ARRAY,
	TEXT_NODE,
	DEFAULT,
	isArray,
	map
} from "./consts";

const createVNode = (name, props, children, element, key, type) => ({
	name,
	props,
	children,
	element,
	key,
	type
});

const createTextVNode = (text, element) =>
	createVNode(text, EMPTY_OBJECT, EMPTY_ARRAY, element, null, TEXT_NODE);

const recycleChild = element =>
	element.nodeType === 3 // Node.TEXT_NODE
		? createTextVNode(element.nodeValue, element)
		: recycleElement(element);

const recycleElement = element =>
	createVNode(
		element.nodeName.toLowerCase(),
		EMPTY_OBJECT,
		map.call(element.childNodes, recycleChild),
		element,
		null,
		RECYCLED_NODE
	);

export const recycle = container => recycleElement(container.children[0]);

export const h = function(name, props) {
	let node;
	const rest = [];
	const children = [];
	let length = arguments.length;

	while (length-- > 2) rest.push(arguments[length]);

	if ((props = props == null ? {} : props).children != null) {
		if (rest.length <= 0) {
			rest.push(props.children);
		}
		delete props.children;
	}

	while (rest.length > 0) {
		if (isArray((node = rest.pop()))) {
			for (length = node.length; length-- > 0; ) {
				rest.push(node[length]);
			}
		} else {
			children.push(
				typeof node === "object" ? node : createTextVNode(node)
			);
		}
	}

	return typeof name === "function"
		? name(props, (props.children = children))
		: createVNode(name, props, children, null, props.key, DEFAULT);
};
