// 弹出窗口类
import { useRememberMeStore } from "@/store/index";
import { createPinia, setActivePinia } from "pinia";
const pinia = createPinia();
setActivePinia(pinia); // 手动激活 Pinia，对于非组件环境特别重要
const store = useRememberMeStore();

export class PopUp {
  private title: string | undefined;
  private type: Type;
  private message: string;
  private static instance: PopUp | null = null;

  private constructor(type: Type, message: string, title?: string) {
    this.title = title;
    this.type = type;
    this.message = message;
  }

  // 单例模式创建对象
  public static getInstance(
    type: Type,
    message: string,
    title?: string
  ): PopUp {
    if (PopUp.instance === null) {
      PopUp.instance = new PopUp(type, message, title);
    } else {
      PopUp.instance.type = type;
      PopUp.instance.message = message;
      PopUp.instance.title = title;
    }
    return PopUp.instance;
  }

  // 显示弹窗
  public show(): void {
    const body = document.body;
    const div = document.createElement("div");
    if (this.type === "confirm") {
      div.classList.add("dialog");
    } else {
      div.classList.add("popup", this.type);
    }

    div.innerHTML = this.type === "confirm" ? this.getDialog() : this.getTips();

    body.appendChild(div);
    if (this.type !== "confirm") {
      this.fadeOut(div);
    } else {
      const mask = div.querySelector(".dialog-mask") as HTMLElement;
      const close = div.querySelector(".dialog-close") as HTMLElement;
      const cancel = div.querySelector(
        ".dialog-buttons .cancel"
      ) as HTMLElement;
      const confirm = div.querySelector(
        ".dialog-buttons .confirm"
      ) as HTMLElement;
      mask.addEventListener("click", () => {
        div.remove();
        store.setRememberMe(false);
      });
      close.addEventListener("click", () => {
        div.remove();
        store.setRememberMe(false);
      });

      cancel.addEventListener("click", () => {
        div.remove();
        store.setRememberMe(false);
      });

      confirm.addEventListener("click", () => {
        div.remove();
        store.setRememberMe(true);
        PopUp.getInstance(Type.success, "已保存密码").show();
      });
    }
  }

  // 提示
  private getTips(): string {
    const HTMLStr = `
    <div class="icon"><i class="iconfont">${this.getIcon()}</i></div>
    ${this.title ? `<div class="popup-title">${this.title}</div>` : ""}
    <div class="popup-message">${this.message}</div>
  `;
    return HTMLStr;
  }

  // 对话框
  private getDialog(): string {
    const HTMLStr = `<div class="dialog-mask"></div>
    <div class="dialog-content">
      <div class="dialog-head">
        <div class="dialog-title">
          <div class="icon"><i class="iconfont">${this.getIcon()}</i></div>
          ${this.title}
        </div>
        <div class="dialog-close">
          <span class="iconfont">&#xe636;</span>
        </div>
      </div>
      <div class="dialog-message">${this.message}</div>
      <div class="dialog-buttons">
        <button class="dialog-button cancel">取消</button>
        <button class="dialog-button confirm">确定</button>
      </div>
    </div>`;
    return HTMLStr;
  }

  // 获取图标类名
  private getIcon(): string {
    switch (this.type) {
      case Type.alert:
        return "&#xe645;";
      case Type.error:
        return "&#xe61e;";
      case Type.success:
        return "&#xe608;";
      default:
        return "&#xe635;";
    }
  }

  // 淡出效果
  private fadeOut(element: HTMLElement): void {
    element.style.opacity = "1";
    setTimeout(() => {
      element.style.opacity = "0";
    }, 2000);
    setTimeout(() => {
      element.remove();
    }, 3000);
  }

  // 其他方法...
}

// 枚举类型
export enum Type {
  info = "info",
  alert = "alert",
  error = "error",
  confirm = "confirm",
  success = "success",
}
