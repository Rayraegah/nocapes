import { h, patch } from "../main";

beforeEach(() => {
	document.body.innerHTML = "";
});

test("oncreate", done => {
	patch(
		document.body,
		null,
		h(
			"div",
			{
				oncreate(element) {
					element.className = "foo";
					expect(document.body.innerHTML).toBe(
						`<div class="foo">foo</div>`
					);
					done();
				}
			},
			"foo"
		)
	);
});

test("onupdate", done => {
	var view = value =>
		h(
			"div",
			{
				class: value,
				onupdate(element, oldProps) {
					expect(element.textContent).toBe("foo");
					expect(oldProps.class).toBe("foo");
					done();
				}
			},
			value
		);

	let node = view("foo");

	patch(document.body, null, node);
	patch(document.body, node, node);
});

test("onremove", done => {
	var view = value =>
		value
			? h(
					"ul",
					{
						oncreate() {
							expect(document.body.innerHTML).toBe(
								"<ul><li></li><li></li></ul>"
							);
						}
					},
					[
						h("li"),
						h("li", {
							onremove() {
								expect(document.body.innerHTML).toBe(
									"<ul><li></li><li></li></ul>"
								);
								return remove => {
									remove();
									expect(document.body.innerHTML).toBe(
										"<ul><li></li></ul>"
									);
									done();
								};
							}
						})
					]
				)
			: h("ul", {}, [h("li")]);

	let node = view(true);
	patch(document.body, null, node);
	patch(document.body, node, view(false));
});

test("event bubling", done => {
	var view = () =>
		h(
			"main",
			{
				oncreate() {
					expect(count++).toBe(3);
				},
				onupdate() {
					expect(count++).toBe(7);
					done();
				}
			},
			[
				h("p", {
					oncreate() {
						expect(count++).toBe(2);
					},
					onupdate() {
						expect(count++).toBe(6);
					}
				}),
				h("p", {
					oncreate() {
						expect(count++).toBe(1);
					},
					onupdate() {
						expect(count++).toBe(5);
					}
				}),
				h("p", {
					oncreate() {
						expect(count++).toBe(0);
					},
					onupdate() {
						expect(count++).toBe(4);
					}
				})
			]
		);

	let count = 0;
	let node = view(true);

	patch(document.body, null, node);
	patch(document.body, node, view(false));
});
