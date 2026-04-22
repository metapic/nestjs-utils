.PHONY: check

build:
	npm run build
	
check: build
	npm --prefix example/ run lint
	npm --prefix example/ run test
