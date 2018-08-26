
/**
 * Given a node, remove tabindex attribute from all children.
 */
function removeTabindex(node) {
	const items = node.querySelectorAll('[tabindex], [role="button"]');
	for (let i=0; i<items.length; i++) {
		items[i].setAttribute('tabindex', '-1');
	}
}
