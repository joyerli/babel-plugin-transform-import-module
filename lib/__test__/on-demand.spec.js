const babel = require('@babel/core');
const _ = require('lodash');
const nu = require('@upman/node-utils');
const plugin = require('../index');


function testUnit(source, options) {
  const { code } = babel.transform(source, {
    filename: 'path/to/file.vue',
    sourceType: 'module',
    plugins: [[plugin, {
      library: {
        'element-ui': (componentName, alias) => [{
          moduleId: alias || componentName,
          source: `element-ui/lib/${_.kebabCase(componentName)}`,
        }, {
          source: `path/to/${_.kebabCase(componentName)}.css`,
        }],
      },
      ...options,
    }]],
  });
  expect(code).toMatchSnapshot();
}

function resetMessage(message) {
  return _.last(message.split(':'));
}

test('导入单个el组件', () => {
  testUnit(`
    import { Button } from 'element-ui';
    console.log(Button);
  `);
});
test('别名', () => {
  testUnit(`
  import { Alert as alert } from 'element-ui'
  console.log(alert);
  `);
});
test('导入多个组件', () => {
  testUnit(`
    import { Alert, Button } from 'element-ui'
    console.log(Alert, Button);
  `);
});
test('别名跟普通导入', () => {
  testUnit(`
    import { Alert as alert, Button } from 'element-ui'
    console.log(alert, Button);
  `);
});
test('多行导入', () => {
  testUnit(`
    import { Alert } from 'element-ui'
    import { Button } from 'element-ui'
    console.log(alert, Button);
  `);
});
test('导入文件', () => {
  testUnit(`
    import 'element-ui';
    console.log('=====');
  `, {
    preventFullImport: false,
  });
});
test('命令空间导入', () => {
  testUnit(`
    import * as Element from 'element-ui';
    console.log(Element);
  `, {
    preventFullImport: false,
  });
});
test('默认导入', () => {
  testUnit(`
    import * as Element from 'element-ui';
    console.log(Element);
  `, {
    preventFullImport: false,
  });
});
test('禁止全局导入之导入文件', () => {
  const { message } = nu.catchErrorSync(() => {
    testUnit(`
      import Element from 'element-ui';
    `);
  });
  expect(resetMessage(message)).toMatchSnapshot();
});
test('禁止全局导入之命令空间导入', () => {
  const { message } = nu.catchErrorSync(() => {
    testUnit(`
      import Element from 'element-ui';
    `);
  });
  expect(resetMessage(message)).toMatchSnapshot();
});
test('禁止全局导入之默认导入', () => {
  const { message } = nu.catchErrorSync(() => {
    testUnit(`
      import * as Element from 'element-ui';
      console.log(Element);
    `);
  });
  expect(resetMessage(message)).toMatchSnapshot();
});
test('允许导出', () => {
  testUnit(`
    console.log(Element);
    export { default } from 'element-ui';
  `, {
    preventExport: false,
  });
});
test('禁止导出', () => {
  const { message } = nu.catchErrorSync(() => {
    testUnit(`
      console.log(Element);
      export { default } from 'element-ui';
    `);
  });
  expect(resetMessage(message)).toMatchSnapshot();
});
