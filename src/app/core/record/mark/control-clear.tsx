import { TooltipButton } from "@/components/tooltip-button"
import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import useMarkStore from "@/stores/mark"
import useTagStore from "@/stores/tag"
import { Eraser } from "lucide-react"
import { useEffect, useState } from "react"
import { delMark } from "@/db/marks";




export function ControlClear() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false)
  const [markCount, setMarkCount] = useState(0);

  const { fetchTags, getCurrentTag } = useTagStore()
  const { fetchMarks, marks } = useMarkStore()


  const handleDelMark = async (ids: number[]) => {
    const len = ids.length;
    if (!len) return;

    try {
      const alltask = [];
      for (let i = 0; i < len; i++) {
        alltask.push(delMark(ids[i]));
      }
      await Promise.all(alltask);
      await fetchMarks()
      await fetchTags();
      getCurrentTag();

      return true;
    } catch (err) {
      console.log(err);

    }
  }


  const handleClear = async () => {
    setLoading(true);

    if (marks.length) {
      const ids = marks.map((item) => item.id);
      await handleDelMark(ids);
      setLoading(false);
      setOpen(false);
    }

  }

  useEffect(() => {

    setMarkCount(marks?.length || 0);

  }, [marks])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TooltipButton icon={<Eraser />} tooltipText={t('record.mark.type.clear') || '清空'} />
      </DialogTrigger>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>{'温馨提示'}</DialogTitle>
          <DialogDescription>确认要删除（{markCount}）条记录吗？</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-between">

          <Button
            type="submit"
            onClick={handleClear}
            disabled={loading}
          >
            {loading ? '处理中...' : (t('record.mark.clear.confirm') || '确认')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
