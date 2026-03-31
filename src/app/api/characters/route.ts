import '@/lib/db-env'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: 获取项目角色
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 })
    }

    const characters = await db.character.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, characters })
  } catch (error) {
    console.error('Fetch characters error:', error)
    return NextResponse.json(
      { success: false, error: '获取角色失败' },
      { status: 500 }
    )
  }
}

// POST: 创建角色
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.projectId || !data.name) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    const character = await db.character.create({ data })

    return NextResponse.json({ success: true, character })
  } catch (error) {
    console.error('Create character error:', error)
    return NextResponse.json(
      { success: false, error: '创建角色失败' },
      { status: 500 }
    )
  }
}

// PUT: 更新角色
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()

    if (!id) {
      return NextResponse.json({ error: '角色ID不能为空' }, { status: 400 })
    }

    const character = await db.character.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, character })
  } catch (error) {
    console.error('Update character error:', error)
    return NextResponse.json(
      { success: false, error: '更新角色失败' },
      { status: 500 }
    )
  }
}

// DELETE: 删除角色
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '角色ID不能为空' }, { status: 400 })
    }

    await db.character.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete character error:', error)
    return NextResponse.json(
      { success: false, error: '删除角色失败' },
      { status: 500 }
    )
  }
}
