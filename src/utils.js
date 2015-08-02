export function merge(to, from) {
	return set(set({}, to), from);
}

export function getKey(node) {
	if (node && node.props) {
		return node.props.key;
	}
}

function set(to, from) {
	for (var i in from) {
		to[i] = from[i];
	}
	return to;
}
