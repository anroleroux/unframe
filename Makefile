include make/tpl.mk

# Three mode flags are used to determine a build. XXX means no flags are enabled.
#
# mode flags:
# - enable unit testing (T)
# - readable web content (R)
# - types of back-end (G|S)

.PHONY: uidev TRX

uidev TRX: ui/layout.html ui/dist/index.css ui/dist/index.js
	@mkdir -p ui/dist
	@sed -i '/\/\/online-start$$/,/\/\/online-end$$/d' ui/dist/index.js
	@sed -i '/\/\/online$$/d' ui/dist/index.js
	$(call compose,ui/layout.html,make/web.map,ui/dist/index.html)
	@echo "Built local dev version → ui/dist/index.html"

ui/dist/index.css: ui/layout.css $(wildcard ui/comps/*/*.css)
	@mkdir -p ui/dist
	$(call compose,ui/layout.css,make/web.map,ui/dist/index.css)

ui/dist/index.js: ui/layout.js ui/reactivity.js $(wildcard ui/comps/*.js) $(wildcard ui/comps/*/*.js)
	@mkdir -p ui/dist
	$(call compose,ui/layout.js,make/web.map,ui/dist/index.js)

.PHONY: clean c

clean c:
	rm -rf ui/dist
