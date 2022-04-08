
// simple-text-treeview @ npm, simple text treeview.

var ui_model_treeview = require("ui-model-treeview");
var ele = require("get-element-by-id");
var ele_id = require("ele-id");
var dispatch_event_by_name = require("dispatch-event-by-name");

var htCss = require("htm-tool-css");	//require ht css

var INDEX_INFO_NODE = 0;
var INDEX_INFO_CHILDREN = 1;
var INDEX_INFO_CONTAINER = 2;

var DEFAULT_NODE_CONTENT_HTML = "<span class='ht tree-to-expand tree-disable'" +
	" style='padding:0em 0.5em;text-decoration:none;font-family:monospace;cursor:default;font-size:inherit;'>" +
	"." +
	"</span>" +
	"<span class='tree-name'></span>";

var simpleTextTreeviewClass = function (container) {
	this.init(container);
}

simpleTextTreeviewClass.prototype = {
	containerId: null,
	selectedId: null,		//the selected node id

	init: function (container) {
		container = ele(container);
		this.containerId = ele_id(container);

		container.onclick = this._onClick || (this._onClick = this.onClick.bind(this));
	},

	clickName: function (el, delay) {
		dispatch_event_by_name.click(ui_model_treeview.nodeName(el), delay);
	},
	clickToExpand: function (el, delay) {
		dispatch_event_by_name.click(ui_model_treeview.nodeToExpand(el), delay);
	},

	getSelected: function () {
		return this.selectedId && ui_model_treeview.getNode(this.selectedId);
	},
	getName: function (elNode) {
		return ui_model_treeview.nodeName(elNode || this.selectedId);
	},

	select:function(el){
		if (this.selectedId) this.getName().classList.remove("selected");

		el=ui_model_treeview.getNode(el);
		htCss.add(ui_model_treeview.nodeName(el), "selected");
		this.selectedId = ele_id(el);
	},

	onClick: function (evt) {
		var el = evt.target;

		if (el.classList.contains("tree-name")) {
			this.select(el);
		}
		else if (el.classList.contains("tree-to-expand")) {
			if (el.classList.contains("cmd")) {
				var elChildren = ui_model_treeview.nodeChildren(el.parentNode);
				if (elChildren && elChildren.hasChildNodes()) {
					var toShow = (elChildren.style.display == "none");

					this.updateToExpand(el.parentNode, toShow ? false : true);

					if (!toShow && this.selectedId && elChildren.contains(this.getSelected())) {
						//un-select hidden node, and select current
						this.clickName(el.parentNode);
					}
				}
			}
			else{
				this.select(el);	//select if the expand-to is disabled
			}
		}
	},
	_onClick: null,	//binding this

	//operation

	//return a NodeInfo, that is, [ elNode, isNodeChildren, isContainer ]
	getNodeInfo: function (elNode) {
		if (!elNode) elNode = this.getSelected();
		else if (elNode instanceof Array) return elNode;		//already a NodeInfo
		else elNode = ele(elNode);	//ensure an dom element

		if (elNode) {
			if (elNode.id === this.containerId) return [elNode, true, true];
			if (elNode.classList.contains("tree-children")) return [elNode, true];

			elNode = ui_model_treeview.getNode(elNode);
		}

		if (!elNode) {
			console.log("invalid node");
			return null;
		}
		return [elNode];
	},

	updateToExpand: function (elNode, state) {
		elNode = ui_model_treeview.getNode(elNode);
		ui_model_treeview.setToExpandState(elNode, state);

		var el = ui_model_treeview.nodeToExpand(elNode);
		(state === "disable") ? htCss.remove(el, "cmd") : htCss.add(el, "cmd");

		if (state === "disable" || !state) {	//state is false or disable
			el = ui_model_treeview.nodeChildren(elNode);
			if (el) el.style.display = "";
		}
		else {	//state is true
			el = ui_model_treeview.nodeChildren(elNode, true);
			el.style.display = "none";
		}
	},

	/*
	add( elNode, text [, options] )
		elNode
			node, nodeChildren, container, NodeInfo
		text
			text or textArray
		options
			.insert
				insert mode
			.updateSelect
				update selection
			.html
				text is html
			.contentHtml
				content-html to create node, default DEFAULT_NODE_CONTENT_HTML
				
	return the first added node
	*/
	add: function (elNode, text, options) {
		//arguments
		var nodeInfo = this.getNodeInfo(elNode);
		if (!nodeInfo) return null;

		elNode = nodeInfo[INDEX_INFO_NODE];
		var isNodeChildren = nodeInfo[INDEX_INFO_CHILDREN];
		var isTop = nodeInfo[INDEX_INFO_CONTAINER];

		//options
		options = options ? Object.create(options) : {};
		options.insert = options.insert && !isNodeChildren;	//only append for node children

		//text is array
		if (text && (text instanceof Array)) {
			var i, imax = text.length, elFirst = null, elNew;

			var updateSelect = options.updateSelect;
			options.updateSelect = false;		//stop updating selection

			for (i = 0; i < imax; i++) {
				elNew = this.add(nodeInfo, text[i], options);
				if (!elNew) {
					console.warn("add text array return null");
					return elFirst;
				}
				if (!elFirst) elFirst = elNew;
			}
			if (updateSelect && elFirst) this.clickName(elFirst);	//select the first
			return elFirst;		//return the first
		}

		if (typeof text !== "string") {
			console.log("invalid text", text);
			return null;
		}

		//add

		var elNew;
		if (options.insert) {
			//insert dom
			elNew = ui_model_treeview.addNode(elNode,
				{ contentHtml: options.contentHtml || DEFAULT_NODE_CONTENT_HTML, insert: true }
			);
			if (options && options.html)
				ui_model_treeview.nodeName(elNew).innerHTML = text;
			else
				ui_model_treeview.nodeName(elNew).textContent = text;
		}
		else {
			//append to children

			//expand existed
			if (!isNodeChildren && ui_model_treeview.getToExpandState(elNode) === true) {
				this.clickToExpand(elNode);
			}

			//append dom
			elNew = ui_model_treeview.addNode(elNode,
				{ contentHtml: options.contentHtml || DEFAULT_NODE_CONTENT_HTML },
				isNodeChildren
			);
			if (options && options.html)
				ui_model_treeview.nodeName(elNew).innerHTML = text;
			else
				ui_model_treeview.nodeName(elNew).textContent = text;

			if (!isTop) {
				//children state
				this.updateToExpand(elNew.parentNode, false);
			}
		}

		//select the new created
		if (options.updateSelect) this.clickName(elNew);

		return elNew;
	},

	insertNext: function (elNode, text, options) {
		//arguments
		var nodeInfo = this.getNodeInfo(elNode);
		if (!nodeInfo) return null;

		elNode = nodeInfo[INDEX_INFO_NODE];

		//options
		options = options ? Object.create(options) : {};
		options.insert = !!elNode.nextSibling;

		return this.add(elNode.nextSibling || elNode.parentNode, text, options);
	},

	//return false to keep the selected, null or node to change.
	prepareRemoveSelect: function (elNodeOrChildren, onlyChildren) {
		if (!this.selectedId) return false;
		if (!elNodeOrChildren.contains(this.getSelected())) return false;	//don't touch selected even .updateSelect is true

		if (!onlyChildren) {
			elNodeOrChildren = ui_model_treeview.getNode(elNodeOrChildren);
			if (elNodeOrChildren.nextSibling) return elNodeOrChildren.nextSibling;
			if (elNodeOrChildren.previousSibling) return elNodeOrChildren.previousSibling;
			elNodeOrChildren = elNodeOrChildren.parentNode;
		}
		if (elNodeOrChildren.id == this.containerId) return null;

		elNodeOrChildren = ui_model_treeview.getNode(elNodeOrChildren);
		if (this.getSelected() === ui_model_treeview.getNode(elNodeOrChildren)) return false;	//unchanged
		return elNodeOrChildren;
	},

	updateRemoveSelect: function (elSelect, updateSelect) {
		//update select state
		if (updateSelect) {
			if (elSelect) this.clickName(elSelect);
			else if (elSelect === null) this.selectedId = null;	//clean the selected
		}
		else {
			if (elSelect !== false) this.selectedId = null;	//clean the selected
		}
	},

	//return true if finished
	//options.onlyChildren:	set true for removing only the children, not the elNode itself;
	remove: function (elNode, options) {
		//arguments
		var onlyChildren = options && options.onlyChildren;

		var nodeInfo = this.getNodeInfo(elNode);
		if (!nodeInfo) return null;
		if (nodeInfo[INDEX_INFO_CHILDREN] && !onlyChildren) return null;

		elNode = nodeInfo[INDEX_INFO_NODE];

		//prepare next selected
		var elSelect = this.prepareRemoveSelect(elNode, onlyChildren);

		var elParent;
		if (onlyChildren) {
			var elParent = (nodeInfo[INDEX_INFO_CHILDREN]) ? elNode : ui_model_treeview.nodeChildren(elNode);
			if (!elParent) return null;

			//remove dom childrens
			elParent.innerHTML = "";
		}
		else {
			elNode = ui_model_treeview.getNode(elNode);
			if (!elNode) return null;
			elParent = elNode.parentNode;

			//remove dom
			elParent.removeChild(elNode);
		}

		//update parent empty children state
		if (elParent && !elParent.hasChildNodes() && elParent.id !== this.containerId) {
			elParent = ui_model_treeview.getNode(elParent);

			this.updateToExpand(elParent, "disable");

			//remove empty parent children
			var elChildren = ui_model_treeview.nodeChildren(elParent);
			elChildren.parentNode.removeChild(elChildren);
		}

		//update select state
		this.updateRemoveSelect(elSelect, options.updateSelect);

		return true;
	},

	//return true if finished
	removeAllChildren: function (elNode, options) {
		options = options ? Object.create(options) : {};
		options.onlyChildren = true;

		return this.remove(elNode, options)
	},

	//return the updated node
	update: function (elNode, text, options) {
		//arguments
		var nodeInfo = this.getNodeInfo(elNode);
		if (!nodeInfo || nodeInfo[INDEX_INFO_CHILDREN] || nodeInfo[INDEX_INFO_CONTAINER]) return null;

		elNode = nodeInfo[INDEX_INFO_NODE];

		if (typeof text !== "string") {
			console.log("invalid data", text);
			return null;
		}

		//update
		if (options && options.html)
			ui_model_treeview.nodeName(elNode).innerHTML = text;
		else
			ui_model_treeview.nodeName(elNode).textContent = text;


		if (options && options.updateSelect) this.clickName(elNode);

		return elNode;
	},

};

//module
exports.INDEX_INFO_NODE = INDEX_INFO_NODE;
exports.INDEX_INFO_CHILDREN = INDEX_INFO_CHILDREN;
exports.INDEX_INFO_CONTAINER = INDEX_INFO_CONTAINER;

exports.DEFAULT_NODE_CONTENT_HTML = DEFAULT_NODE_CONTENT_HTML;

exports.class = simpleTextTreeviewClass
