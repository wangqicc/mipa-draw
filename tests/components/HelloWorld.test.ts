import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('应该正确渲染HelloWorld组件', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Hello Test'
      }
    })

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hello Test')
  })

  it('应该显示props消息', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test Message'
      }
    })

    expect(wrapper.text()).toContain('Test Message')
  })

  it('应该响应式更新props', async () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Initial Message'
      }
    })

    expect(wrapper.text()).toContain('Initial Message')

    await wrapper.setProps({ msg: 'Updated Message' })
    expect(wrapper.text()).toContain('Updated Message')
  })

  it('应该处理组件交互', async () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Interactive Test'
      }
    })

    // 检查交互元素
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('count is 0')

    // 测试点击事件
    await button.trigger('click')
    expect(wrapper.text()).toContain('count is 1')
  })

  it('应该显示代码编辑提示', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test Message'
      }
    })

    expect(wrapper.text()).toContain('Edit')
    expect(wrapper.text()).toContain('components/HelloWorld.vue')
    expect(wrapper.text()).toContain('to test HMR')
  })

  it('应该显示相关链接', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test Message'
      }
    })

    expect(wrapper.text()).toContain('create-vue')
    expect(wrapper.text()).toContain('Vue Docs Scaling up Guide')
  })

  it('应该显示底部提示', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test Message'
      }
    })

    expect(wrapper.text()).toContain('Click on the Vite and Vue logos to learn more')
  })

  it('应该有正确的样式类', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test Message'
      }
    })

    expect(wrapper.find('.read-the-docs').exists()).toBe(true)
  })
})