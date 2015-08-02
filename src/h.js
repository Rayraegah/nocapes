export function h(type, props) {
	let node;
	const stack = [];
	const children = [];
	const args = arguments;

	for (let a = args.length; a-- > 2; ) {
		stack.push(args[a]);
	}

	while (stack.length) {
		if (Array.isArray((node = stack.pop()))) {
			for (let n = node.length; n--; ) {
				stack.push(node[n]);
			}
		} else if (node != null && node !== true && node !== false) {
			children.push(typeof node === "number" ? (node = `${node}`) : node);
		}
	}

	return typeof type === "string"
		? {
				type,
				props: props || {},
				children
			}
		: type(props || {}, children);
}
