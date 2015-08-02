import { merge, getKey } from "./utils";

const lifecycle = [];

export function patch(parent, oldNode, newNode) {
	const element = patchElement(parent, parent.children[0], oldNode, newNode);

	for (let next; (next = lifecycle.pop()); next()) {}

	return element;
}

function createElement(node, isSVG) {
	let element = void 0;
	if (typeof node === "string") {
		element = document.createTextNode(node);
	} else {
		element = (isSVG = isSVG || node.type === "svg")
			? document.createElementNS("http://www.w3.org/2000/svg", node.type)
			: document.createElement(node.type);

		if (node.props && node.props.oncreate) {
			lifecycle.push(() => {
				node.props.oncreate(element);
			});
		}

		for (let nc = 0; nc < node.children.length; nc++) {
			element.appendChild(createElement(node.children[nc], isSVG));
		}

		for (let np in node.props) {
			setElementProp(element, np, node.props[np]);
		}
	}
	return element;
}

function setElementProp(element, name, value, oldValue) {
	if (name === "key") {
	} else if (name === "style") {
		for (let name in merge(oldValue, (value = value || {}))) {
			element.style[name] = value[name] != null ? value[name] : "";
		}
	} else {
		try {
			element[name] = null == value ? "" : value; // element[name] = value;
		} catch (err) {}

		if (typeof value !== "function") {
			if (
				/*
				!value &&
				typeof value !== "string" &&
				typeof value !== "number"
			*/
				null == value ||
				value === false
			) {
				element.removeAttribute(name);
			} else {
				element.setAttribute(name, value);
			}
		}
	}
}

function updateElement(element, oldProps, props) {
	for (const i in merge(oldProps, props)) {
		const value = props[i];
		const oldValue =
			i === "value" || i === "checked" ? element[i] : oldProps[i];

		if (value !== oldValue) {
			setElementProp(element, i, value, oldValue);
		}
	}

	if (props && props.onupdate) {
		lifecycle.push(() => {
			props.onupdate(element, oldProps);
		});
	}
}

function removeElement(parent, element, props) {
	if (
		props &&
		props.onremove &&
		typeof (props = props.onremove(element)) === "function"
	) {
		props(remove);
	} else {
		remove();
	}

	function remove() {
		parent.removeChild(element);
	}
}

function patchElement(parent, element, oldNode, node, isSVG, nextSibling) {
	if (oldNode == null) {
		element = parent.insertBefore(createElement(node, isSVG), element);
	} else if (node.type != null && node.type === oldNode.type) {
		updateElement(element, oldNode.props, node.props);

		isSVG = isSVG || node.type === "svg";

		const len = node.children.length;
		const oldLen = oldNode.children.length;
		const oldKeyed = {};
		const oldElements = [];
		const keyed = {};

		for (let n = 0; n < oldLen; n++) {
			const oldElement = (oldElements[n] = element.childNodes[n]);
			const oldChild = oldNode.children[n];
			const oldKey = getKey(oldChild);

			if (null != oldKey) {
				oldKeyed[oldKey] = [oldElement, oldChild];
			}
		}

		let i = 0;
		let j = 0;

		while (j < len) {
			const oldElement = oldElements[i];
			const oldChild = oldNode.children[i];
			const newChild = node.children[j];
			const oldKey = getKey(oldChild);

			if (keyed[oldKey]) {
				i++;
				continue;
			}

			const newKey = getKey(newChild);
			const keyedNode = oldKeyed[newKey] || [];

			if (newKey == null) {
				if (oldKey == null) {
					patchElement(
						element,
						oldElement,
						oldChild,
						newChild,
						isSVG
					);
					j++;
				}
				i++;
			} else {
				if (oldKey === newKey) {
					patchElement(
						element,
						keyedNode[0],
						keyedNode[1],
						newChild,
						isSVG
					);
					i++;
				} else if (keyedNode[0]) {
					element.insertBefore(keyedNode[0], oldElement);
					patchElement(
						element,
						keyedNode[0],
						keyedNode[1],
						newChild,
						isSVG
					);
				} else {
					patchElement(element, oldElement, null, newChild, isSVG);
				}

				j++;
				keyed[newKey] = newChild;
			}
		}

		while (i < oldLen) {
			const oldChild = oldNode.children[i];
			const oldKey = getKey(oldChild);
			if (oldKey == null) {
				removeElement(element, oldElements[i], oldChild.props);
			}
			i++;
		}

		for (let i in oldKeyed) {
			const keyedNode = oldKeyed[i];
			const reusableNode = keyedNode[1];
			if (!keyed[reusableNode.props.key]) {
				removeElement(element, keyedNode[0], reusableNode.props);
			}
		}
	} else if (element && node !== element.nodeValue) {
		if (typeof node === "string" && typeof oldNode === "string") {
			element.nodeValue = node;
		} else {
			element = parent.insertBefore(
				createElement(node, isSVG),
				(nextSibling = element)
			);
			removeElement(parent, nextSibling, oldNode.props);
		}
	}
	return element;
}
