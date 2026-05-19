import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: 获取项目的剧集列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 })
    }

    const episodes = await db.episode.findMany({
      where: { projectId },
      orderBy: { episodeNo: 'asc' }
    })

    return NextResponse.json({ success: true, episodes })
  } catch (error) {
    console.error('Fetch episodes error:', error)
    return NextResponse.json(
      { success: false, error: '获取剧集失败' },
      { status: 500 }
    )
  }
}

// POST: 创建剧集（或保存剧本）
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.projectId || !data.title) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    const episode = await db.episode.create({ data })

    return NextResponse.json({ success: true, episode })
  } catch (error) {
    console.error('Create episode error:', error)
    return NextResponse.json(
      { success: false, error: '创建剧集失败' },
      { status: 500 }
    )
  }
}

// PUT: 更新剧集（保存剧本内容）
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()

    if (!id) {
      return NextResponse.json({ error: '剧集ID不能为空' }, { status: 400 })
    }

    const episode = await db.episode.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, episode })
  } catch (error) {
    console.error('Update episode error:', error)
    return NextResponse.json(
      { success: false, error: '更新剧集失败' },
      { status: 500 }
    )
  }
}

// DELETE: 删除剧集
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '剧集ID不能为空' }, { status: 400 })
    }

    await db.episode.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete episode error:', error)
    return NextResponse.json(
      { success: false, error: '删除剧集失败' },
      { status: 500 }
    )
  }
}
