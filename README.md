[TOC]

# 按需导入库模块

添加依赖:
```
npm i -D babel-plugin-transform-import-module
```

它可以转化下面这何种导入:
```
import { Row, Grid as MyGrid } from 'react-bootstrap';
```
将其转换为：
```
import Row from 'react-bootstrap/lib/Row';
import MyGrid from 'react-bootstrap/lib/Grid';
```

只需要在babel配置中添加插件并配置:
```
{
  plugins: [
    ['transform-import-module', {
      library: {
          'react-bootstrap': (componentName, alias) => [{
            moduleId: alias || componentName,
            source: `react-bootstrap/lib/${_.kebabCase(componentName)}`,
          }],
      }
    }]
  ]
}
```

对于antd这种需要额外导入样式文件的也支持:
```
import { Button } from 'antd';
```
将其转换为：
```
import Button from 'antd/lib/button';
import 'antd/lib/button/style/index.js',
```

只需要在babel配置中添加插件并配置:
```
{
  plugins: [
    ['transform-import-module', {
      library: {
          'antd': (componentName, alias) => [{
            moduleId: alias || componentName,
            source: `antd/lib/${_.kebabCase(componentName)}`,
          }, {
            source: `antd/lib/${_.kebabCase(componentName)}/style/index.js`,
          }],
      }
    }]
  ]
}
```

利用好配置，可以支持对项目中所有的库模块的按需导入，并且支持高度定制化的导入方式，如支持antd的主题切换（切换导入组件的样式文件地址）。

## 选项

### library

类型为：`{ [libraryId: string]: (componentName: string, alias: string) => {moduleId: string, source: string}[] }`。

库按需导入配置。

值为一个对象，每个键为库的id, 如`antd`, `@component`等，等源码中导入语句中的地址匹配库id时，就会开启按需导入。如：
```
import { Button } from 'antd';
import { MyButton } from '@component';
```
如果配置了`antd`, `@component`两个库的化，就会触发。

library对象的值为一个回调配置函数，函数会传入两个参数`componentName`和`alias`, 返回一个新导入的信息列表。
* `componentName`为导入的组件名，如`import { Button } from 'antd';`中`componentName`会为`Button`;
* `alias`为导入的具名别名，如`import { Button as AntdButton } from 'antd';`，那么`alias`会为`AntdButton`;
* 返回的列表中每一个信息为一个对象，对象的格式为：`{moduleId: string, source: string}`；
  * `moduleId`为新导入语句的模块id, 指导新生成的导入语句中的具名，如设置`ModuleId`会生成`import ModuleId from '...'`，不设置时，会生成命名控件导入，如`import '....'`；
  * `source`为新导入语句的导入地址，如设置`/path/to/file.js`将会生成语句`import moduleId from '/path/to/file.js'`。


### preventFullImport
是否允许在源码中全导入了前配置了按需导入的库。

如果设置为true, 且设置了：
```
{
  plugins: [
    ['transform-import-module', {
      library: {
          'react-bootstrap': (componentName, alias) => [{
            moduleId: alias || componentName,
            source: `react-bootstrap/lib/${_.kebabCase(componentName)}`,
          }],
      }
    }]
  ]
}
```
那么在源码中如果存在：
```
import * as ReactBootstrap from 'react-bootstrap';
```
那么就会报错。

