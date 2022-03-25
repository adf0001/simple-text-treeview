
// simple-text-treeview @ npm, simple text treeview.

var ui_model_treeview = require("ui-model-treeview");
var ele = require("get-element-by-id");
var ele_id = require("ele-id");
var dispatch_event_by_name = require("dispatch-event-by-name");

var htCss = require("htm-tool-css");	//require ht css

var INDEX_INFO_NODE = 0;
var INDEX_INFO_CHILDREN = 1;
var INDEX_INFO_CONTAINER = 2;

var simpleTextTreeviewClass = function (container) {
	this.init(container);
}

simpleTextTreeviewClass.prototype = {
	INDEX_INFO_NODE: INDEX_INFO_NODE,
	INDEX_INFO_CHILDREN: INDEX_INFO_CHILDREN,
	INDEX_INFO_CONTAINER: INDEX_INFO_CONTAINER,

	containerId: null,
	selectedName: null,		//the selected node name

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

	onClick: function (evt) {
		var el = evt.target;

		if (el.classList.contains("tree-name")) {
			if (this.selectedName) this.selectedName.classList.remove("selected");
			htCss.add(el, "selected");
			this.selectedName = el;
		}
		else if (el.classList.contains("tree-to-expand") && el.classList.contains("cmd")) {
			var elChildren = ui_model_treeview.nodeChildren(el.parentNode);
			if (elChildren && elChildren.hasChildNodes()) {
				var toShow = (elChildren.style.display == "none");

				ui_model_treeview.setToExpandState(el.parentNode, toShow ? false : true);
				elChildren.style.display = toShow ? "" : "none";

				if (!toShow && this.selectedName && elChildren.contains(this.selectedName)) {
					//un-select hidden node, and select current
					this.clickName(el.parentNode);
				}
			}
		}
	},
	_onClick: null,	//binding this

	formatContent: function (name, hasChildren) {
		var a = [];

		a[a.length] = "<span class='ht tree-to-expand" + (hasChildren ? " cmd" : " tree-disable") + "'" +
			" style='padding:0em 0.5em;text-decoration:none;font-family:monospace;font-size:9pt;cursor:default;'>" +
			(hasChildren ? "+" : ".") +
			"</span>";

		a[a.length] = "<span class='tree-name'>" + /*name +*/ "</span>";	//to avoid bad html format

		return a.join("");
	},

	//operation

	//return a NodeInfo, that is, [ elNode, isNodeChildren, isContainer ]
	getNodeInfo: function (elNode) {
		if (!elNode) elNode = this.selectedName;
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

			var updateLast = options.updateSelect;
			options.updateSelect = false;		//stop updating selection

			for (i = 0; i < imax; i++) {
				elNew = this.add(nodeInfo, text[i], options);
				if (!elNew) {
					console.warn("add text array return null");
					return elFirst;
				}
				if (!elFirst) elFirst = elNew;
			}
			if (updateLast && elNew) this.clickName(elNew);	//select the last
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
				{ contentHtml: this.formatContent(text), insert: true }
			);
			ui_model_treeview.nodeName(elNew).innerHTML = text;
		}
		else {
			//append to children

			//expand existed
			if (!isNodeChildren && ui_model_treeview.getToExpandState(elNode) === true) {
				this.clickToExpand(elNode);
			}

			//append dom
			elNew = ui_model_treeview.addNode(elNode,
				{ contentHtml: this.formatContent(text) },
				isNodeChildren
			);
			ui_model_treeview.nodeName(elNew).innerHTML = text;

			if (!isTop) {
				//children state
				ui_model_treeview.setToExpandState(elNew.parentNode, false);		//set icon to '-'
				htCss.add(ui_model_treeview.nodeToExpand(elNew.parentNode), "cmd");	//cursor & cmd
				ui_model_treeview.nodeChildren(elNew.parentNode).style.display = "";	//expand hidden
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

	//return true if finished
	remove: function (elNode, options) {
		//arguments
		var nodeInfo = this.getNodeInfo(elNode);
		if (!nodeInfo || nodeInfo[INDEX_INFO_CHILDREN] || nodeInfo[INDEX_INFO_CONTAINER]) return null;

		elNode = nodeInfo[INDEX_INFO_NODE];

		var selectedRemoved = this.selectedName && elNode.contains(this.selectedName);

		//prepare next selected
		var elSelect = elNode.nextSibling || elNode.previousSibling;
		var elParent = elSelect ? null : elNode.parentNode;		//empty child node after removing
		var isParentTop = elParent && elParent.id == this.containerId;

		//remove dom
		elNode.parentNode.removeChild(elNode);

		//update parent empty children state
		if (elParent && !isParentTop) {
			elParent = ui_model_treeview.getNode(elParent);

			ui_model_treeview.setToExpandState(elParent, "tree-disable");
			ui_model_treeview.nodeToExpand(elParent).classList.remove("cmd");
			ui_model_treeview.nodeChildren(elParent).style.display = "none";

			//remove empty parent children
			var elChildren = ui_model_treeview.nodeChildren(elParent);
			elChildren.parentNode.removeChild(elChildren);
		}

		if (!selectedRemoved) return true;	//don't touch selected even options.updateSelect is true

		if (!options || !options.updateSelect) {
			this.selectedName = null;	//just clean selected
			return true;
		}

		//select next
		if (elSelect) {
			this.clickName(elSelect);
			return true;
		}

		//unselect for top
		if (isParentTop) {
			this.selectedName = null;	//just clean selected for top
			return true;
		}

		//select parent
		elParent = ui_model_treeview.getNode(elParent);

		this.clickName(elParent);

		return true;
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
		ui_model_treeview.nodeName(elNode).innerHTML = text;

		if (options && options.updateSelect) this.clickName(elNode);

		return elNode;
	},

};

//module

exports.class = simpleTextTreeviewClass
