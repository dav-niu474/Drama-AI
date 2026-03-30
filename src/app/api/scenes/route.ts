import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: 获取项目场景
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 })
    }

    const scenes = await db.dramaScene.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ success: true, scenes })
  } catch (error) {
    console.error('Fetch scenes error:', error)
    return NextResponse.json(
      { success: false, error: '获取场景失败' },
      { status: 500 }
    )
  }
}

// POST: 创建场景
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.projectId || !data.title) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    const scene = await db.dramaScene.create({ data })

    return NextResponse.json({ success: true, scene })
  } catch (error) {
    console.error('Create scene error:', error)
    return NextResponse.json(
      { success: false, error: '创建场景失败' },
      { status: 500 }
    )
  }
}

// PUT: 更新场景
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()

    if (!id) {
      return NextResponse.json({ error: '场景ID不能为空' }, { status: 400 })
    }

    const scene = await db.dramaScene.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, scene })
  } catch (error) {
    console.error('Update scene error:', error)
    return NextResponse.json(
      { success: false, error: '更新场景失败' },
      { status: 500 }
    )
  }
}

// DELETE: 删除场景
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '场景ID不能为空' }, { status: 400 })
    }

    await db.dramaScene.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete scene error:', error)
    return NextResponse.json(
      { success: false, error: '删除场景失败' },
      { status: 500 }
    )
  }
}
