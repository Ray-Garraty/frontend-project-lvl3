install:
	npm install

publish:
	npm publish --dry-run

build:
	rm -rf dist
	NODE_ENV=production npx webpack

develop:
	rm -rf dist
	NODE_ENV=development npx webpack

lint:
	npx eslint .

.PHONY: test