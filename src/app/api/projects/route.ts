import '@/lib/db-env'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: 获取所有项目
export async function GET() {
  try {
    const projects = await db.dramaProject.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { characters: true, scenes: true, episodes: true }
        }
      }
    })
    
    return NextResponse.json({ success: true, projects })
  } catch (error) {
    console.error('Fetch projects error:', error)
    return NextResponse.json(
      { success: false, error: '获取项目失败' },
      { status: 500 }
    )
  }
}

// POST: 创建新项目
export async function POST(req: NextRequest) {
  try {
    const { name, genre, description, coverImage } = await req.json()

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 })
    }

    const project = await db.dramaProject.create({
      data: {
        name,
        genre: genre || '都市',
        description: description || '',
        coverImage: coverImage || '/images/hero.png',
      }
    })

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { success: false, error: '创建项目失败' },
      { status: 500 }
    )
  }
}

// PUT: 更新项目
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()

    if (!id) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 })
    }

    const project = await db.dramaProject.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { success: false, error: '更新项目失败' },
      { status: 500 }
    )
  }
}

// DELETE: 删除项目
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 })
    }

    await db.dramaProject.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { success: false, error: '删除项目失败' },
      { status: 500 }
    )
  }
}
