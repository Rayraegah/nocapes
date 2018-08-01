import { eventProxy, getKey, createKeyMap, merge } from "./utils";
import { XLINK_NS, TEXT_NODE, SVG_NS, RECYCLED_NODE } from "./consts";

const updateProperty = (element, name, lastValue, nextValue, isSvg) => {
	if (name === "style") {
		for (const i in merge(lastValue, nextValue)) {
			const style =
				nextValue == null || nextValue[i] == null ? "" : nextValue[i];
			if (i[0] === "-") {
				element[name].setProperty(i, style);
			} else {
				element[name][i] = style;
			}
		}
	} else {
		if (name[0] === "o" && name[1] === "n") {
			if (!element.events) element.events = {};

			element.events[(name = name.slice(2))] = nextValue;

			if (nextValue == null) {
				element.removeEventListener(name, eventProxy);
			} else if (lastValue == null) {
				element.addEventListener(name, eventProxy);
			}
		} else {
			const nullOrFalse = nextValue == null || nextValue === false;

			if (
				name in element &&
				name !== "list" &&
				name !== "draggable" &&
				name !== "spellcheck" &&
				name !== "translate" &&
				!isSvg
			) {
				element[name] = nextValue == null ? "" : nextValue;
				if (nullOrFalse) {
					element.removeAttribute(name);
				}
			} else {
				const ns =
					isSvg && name !== (name = name.replace(/^xlink:?/, ""));
				if (ns) {
					if (nullOrFalse) {
						element.removeAttributeNS(XLINK_NS, name);
					} else {
						element.setAttributeNS(XLINK_NS, name, nextValue);
					}
				} else {
					if (nullOrFalse) {
						element.removeAttribute(name);
					} else {
						element.setAttribute(name, nextValue);
					}
				}
			}
		}
	}
};

const createElement = (node, lifecycle, isSvg) => {
	const element =
		node.type === TEXT_NODE
			? document.createTextNode(node.name)
			: node.name === "svg"
				? document.createElementNS(SVG_NS, node.name)
				: document.createElement(node.name);

	const props = node.props;
	if (props.oncreate) {
		lifecycle.push(() => {
			props.oncreate(element);
		});
	}

	for (let i = 0, length = node.children.length; i < length; i++) {
		element.appendChild(createElement(node.children[i], lifecycle, isSvg));
	}

	for (const name in props) {
		updateProperty(element, name, null, props[name], isSvg);
	}

	return (node.element = element);
};

const updateElement = (
	element,
	lastProps,
	nextProps,
	lifecycle,
	isSvg,
	isRecycled
) => {
	for (const name in merge(lastProps, nextProps)) {
		if (
			(name === "value" || name === "checked"
				? element[name]
				: lastProps[name]) !== nextProps[name]
		) {
			updateProperty(
				element,
				name,
				lastProps[name],
				nextProps[name],
				isSvg
			);
		}
	}

	const cb = isRecycled ? nextProps.oncreate : nextProps.onupdate;
	if (cb != null) {
		lifecycle.push(() => {
			cb(element, lastProps);
		});
	}
};

const removeChildren = node => {
	for (let i = 0, length = node.children.length; i < length; i++) {
		removeChildren(node.children[i]);
	}

	const cb = node.props.ondestroy;
	if (cb != null) {
		cb(node.element);
	}

	return node.element;
};

const removeElement = (parent, node) => {
	const remove = () => {
		parent.removeChild(removeChildren(node));
	};

	const cb = node.props && node.props.onremove;
	if (cb != null) {
		cb(node.element, remove);
	} else {
		remove();
	}
};

const patchElement = (
	parent,
	element,
	lastNode,
	nextNode,
	lifecycle,
	isSvg
) => {
	if (
		lastNode != null &&
		lastNode.type === TEXT_NODE &&
		nextNode.type === TEXT_NODE
	) {
		if (lastNode.name !== nextNode.name) {
			element.nodeValue = nextNode.name;
		}
	} else if (lastNode == null || lastNode.name !== nextNode.name) {
		const newElement = parent.insertBefore(
			createElement(nextNode, lifecycle, isSvg),
			element
		);

		if (lastNode != null) removeElement(parent, lastNode);

		element = newElement;
	} else {
		updateElement(
			element,
			lastNode.props,
			nextNode.props,
			lifecycle,
			(isSvg = isSvg || nextNode.name === "svg"),
			lastNode.type === RECYCLED_NODE
		);

		let savedNode;
		let childNode;

		let lastKey;
		const lastChildren = lastNode.children;
		let lastChStart = 0;
		let lastChEnd = lastChildren.length - 1;

		let nextKey;
		const nextChildren = nextNode.children;
		let nextChStart = 0;
		let nextChEnd = nextChildren.length - 1;

		while (nextChStart <= nextChEnd && lastChStart <= lastChEnd) {
			lastKey = getKey(lastChildren[lastChStart]);
			nextKey = getKey(nextChildren[nextChStart]);

			if (lastKey == null || lastKey !== nextKey) break;

			patchElement(
				element,
				lastChildren[lastChStart].element,
				lastChildren[lastChStart],
				nextChildren[nextChStart],
				lifecycle,
				isSvg
			);

			lastChStart++;
			nextChStart++;
		}

		while (nextChStart <= nextChEnd && lastChStart <= lastChEnd) {
			lastKey = getKey(lastChildren[lastChEnd]);
			nextKey = getKey(nextChildren[nextChEnd]);

			if (lastKey == null || lastKey !== nextKey) break;

			patchElement(
				element,
				lastChildren[lastChEnd].element,
				lastChildren[lastChEnd],
				nextChildren[nextChEnd],
				lifecycle,
				isSvg
			);

			lastChEnd--;
			nextChEnd--;
		}

		if (lastChStart > lastChEnd) {
			while (nextChStart <= nextChEnd) {
				element.insertBefore(
					createElement(
						nextChildren[nextChStart++],
						lifecycle,
						isSvg
					),
					(childNode = lastChildren[lastChStart]) && childNode.element
				);
			}
		} else if (nextChStart > nextChEnd) {
			while (lastChStart <= lastChEnd) {
				removeElement(element, lastChildren[lastChStart++]);
			}
		} else {
			const lastKeyed = createKeyMap(
				lastChildren,
				lastChStart,
				lastChEnd
			);
			const nextKeyed = {};

			while (nextChStart <= nextChEnd) {
				lastKey = getKey((childNode = lastChildren[lastChStart]));
				nextKey = getKey(nextChildren[nextChStart]);

				if (
					nextKeyed[lastKey] ||
					(nextKey != null &&
						nextKey === getKey(lastChildren[lastChStart + 1]))
				) {
					if (lastKey == null) {
						removeElement(element, childNode);
					}
					lastChStart++;
					continue;
				}

				if (nextKey == null || lastNode.type === RECYCLED_NODE) {
					if (lastKey == null) {
						patchElement(
							element,
							childNode && childNode.element,
							childNode,
							nextChildren[nextChStart],
							lifecycle,
							isSvg
						);
						nextChStart++;
					}
					lastChStart++;
				} else {
					if (lastKey === nextKey) {
						patchElement(
							element,
							childNode.element,
							childNode,
							nextChildren[nextChStart],
							lifecycle,
							isSvg
						);
						nextKeyed[nextKey] = true;
						lastChStart++;
					} else {
						if ((savedNode = lastKeyed[nextKey]) != null) {
							patchElement(
								element,
								element.insertBefore(
									savedNode.element,
									childNode && childNode.element
								),
								savedNode,
								nextChildren[nextChStart],
								lifecycle,
								isSvg
							);
							nextKeyed[nextKey] = true;
						} else {
							patchElement(
								element,
								childNode && childNode.element,
								null,
								nextChildren[nextChStart],
								lifecycle,
								isSvg
							);
						}
					}
					nextChStart++;
				}
			}

			while (lastChStart <= lastChEnd) {
				if (getKey((childNode = lastChildren[lastChStart++])) == null) {
					removeElement(element, childNode);
				}
			}

			for (const key in lastKeyed) {
				if (nextKeyed[key] == null) {
					removeElement(element, lastKeyed[key]);
				}
			}
		}
	}

	return (nextNode.element = element);
};

export const patch = (lastNode, nextNode, container) => {
	const lifecycle = [];

	patchElement(
		container,
		container.children[0],
		lastNode,
		nextNode,
		lifecycle
	);

	while (lifecycle.length > 0) lifecycle.pop()();

	return nextNode;
};
