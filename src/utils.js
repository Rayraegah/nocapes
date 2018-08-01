export const eventProxy = event =>
	event.currentTarget.events[event.type](event);

export const getKey = node => (node == null ? null : node.key);

export const createKeyMap = (children, start, end) => {
	const out = {};
	let key;
	let node;

	for (; start <= end; start++) {
		if ((key = (node = children[start]).key) != null) {
			out[key] = node;
		}
	}

	return out;
};

export const merge = (a, b) => {
	const target = {};
	let i;
	for (i in a) target[i] = a[i];
	for (i in b) target[i] = b[i];

	return target;
};
