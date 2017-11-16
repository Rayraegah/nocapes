const set = (to, from) => {
	for (var i in from) {
		to[i] = from[i];
	}
	return to;
};

export const merge = (to, from) => {
	return set(set({}, to), from);
};

export const getKey = node => {
	if (node && node.props) {
		return node.props.key;
	}
};
