
//global variable, for html page, refer tpsvr @ npm.
simple_text_treeview = require("../simple-text-treeview.js");

module.exports = {

	"simple_text_treeview": function (done) {
		if (typeof window === "undefined") throw "disable for nodejs";

		//dom
		document.getElementById('divResult3').innerHTML =
			"<div id='name-click-msg' style='border:1px solid lightgrey;'>&nbsp;</div>" +
			"<div>" +
			"<span class='ht cmd' id='sp-cmd-add'>+add</span>/" +
			"<span class='ht cmd' id='sp-cmd-add-2'>2</span> " +
			"<span class='ht cmd' id='sp-cmd-insert'>+insert</span>/" +
			"<span class='ht cmd' id='sp-cmd-insert-2'>2</span> " +
			"<span class='ht cmd' id='sp-cmd-insert-next'>+insert-next</span>/" +
			"<span class='ht cmd' id='sp-cmd-insert-next-2'>2</span> &nbsp; " +
			"<span class='ht cmd' id='sp-cmd-remove'>-remove</span> &nbsp; " +
			"<span class='ht cmd' id='sp-cmd-update'>=update</span> " +
			"</div>" +
			"<div id='st-treeview'></div>";

		var el = document.getElementById('st-treeview');

		//new .class(container)
		var tv = new simple_text_treeview.class(el);

		el.addEventListener("click", function (evt) {
			var target = evt.target;
			if (target && target.classList.contains("tree-name")) {
				var s = target.textContent;

				document.getElementById('name-click-msg').innerHTML = s;
			}
		})

		document.getElementById('sp-cmd-add').onclick = function () {
			//add: function (elNode, text/textArray [, insert [, top]] )
			//return the first added node
			tv.add(tv.selectedName || el, "" + (new Date()), false, !tv.selectedName);
		};
		document.getElementById('sp-cmd-add-2').onclick = function () {
			//insert array
			tv.add(tv.selectedName || el, ["" + (new Date()), "" + (new Date()) + "/2"], false, !tv.selectedName);
		};
		document.getElementById('sp-cmd-insert').onclick = function () {
			tv.add(tv.selectedName || el, "" + (new Date()), true, !tv.selectedName);
		};
		document.getElementById('sp-cmd-insert-2').onclick = function () {
			tv.add(tv.selectedName || el, ["" + (new Date()), "" + (new Date()) + "/2"], true, !tv.selectedName);
		};
		document.getElementById('sp-cmd-insert-next').onclick = function () {
			//insertNext(elNode, text)
			if (tv.selectedName) tv.insertNext(null, "" + new Date());
			else tv.add(el, "" + (new Date()), false, true);
		};
		document.getElementById('sp-cmd-insert-next-2').onclick = function () {
			if (tv.selectedName) tv.insertNext(null, ["" + (new Date()), "" + (new Date()) + "/2"]);
			else tv.add(el, ["" + (new Date()), "" + (new Date()) + "/2"], false, true);
		};
		document.getElementById('sp-cmd-remove').onclick = function () {
			//remove(elNode)
			tv.remove();	//remove the selected
		};
		document.getElementById('sp-cmd-update').onclick = function () {
			//update(elNode, text)
			tv.update(null, "" + (new Date()));	//update the selected
		};

		return "ui-test";
	},

};

// for html page
//if (typeof setHtmlPage === "function") setHtmlPage("title", "10em", 1);	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('simple_text_treeview', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(5000); } });
