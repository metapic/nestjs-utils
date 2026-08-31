.PHONY: check

build:
	npm run build
	
check: build
	npm run lint
	npm --prefix example/ run lint
	npm --prefix example/ run test
