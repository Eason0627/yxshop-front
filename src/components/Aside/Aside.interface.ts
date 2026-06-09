// {
//     url: "/home",
//     name: "首页",
//     left_icon: "&#xe629;",
//     right_icon: "&#xe632;",
//     children: [
//       {
//         url: "/home/dashboard",
//         name: "子菜单",
//         right_icon: "&#xe632;",
//         children: [
//           {
//             url: "/home/dashboard/table",
//             name: "子菜单",
//             right_icon: "&#xe632;",
//           },
//         ],
//       },
//       {
//         url: "/home/marketing",
//         name: "子菜单",
//         left_icon: "",
//         right_icon: "&#xe632;",
//         children: [],
//       },
//     ],
//   },
export interface NavigationItem {
    url: string;
    name: string;
    left_icon?: string;
    right_icon?: string;
    children?: NavigationItem[];
    expand?: boolean;
    active?: boolean;
  }